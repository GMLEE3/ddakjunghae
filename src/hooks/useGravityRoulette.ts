'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import Matter from 'matter-js';
import type { AIRecommendation } from '@/types';

interface UseGravityRouletteProps {
    recommendations: AIRecommendation[];
    onSelect: (recommendation: AIRecommendation) => void;
}

export function useGravityRoulette({ recommendations, onSelect }: UseGravityRouletteProps) {
    const sceneRef = useRef<HTMLDivElement>(null);
    const engineRef = useRef<Matter.Engine | null>(null);
    const renderRef = useRef<Matter.Render | null>(null);
    const runnerRef = useRef<Matter.Runner | null>(null);
    const bodiesRef = useRef<Map<number, AIRecommendation>>(new Map());

    const [isRunning, setIsRunning] = useState(false);
    const [selectedId, setSelectedId] = useState<string | null>(null);

    const initialize = useCallback(() => {
        if (!sceneRef.current || recommendations.length === 0) return;

        // 기존 엔진 정리
        cleanup();

        const width = sceneRef.current.clientWidth;
        const height = sceneRef.current.clientHeight;

        // Matter.js 엔진 생성
        const engine = Matter.Engine.create({
            gravity: { x: 0, y: 0 }, // 무중력 시작
        });
        engineRef.current = engine;

        // 렌더러 생성 (투명 배경)
        const render = Matter.Render.create({
            element: sceneRef.current,
            engine: engine,
            options: {
                width,
                height,
                wireframes: false,
                background: 'transparent',
            },
        });
        renderRef.current = render;

        // 벽 생성
        const wallThickness = 50;
        const walls = [
            // 바닥
            Matter.Bodies.rectangle(width / 2, height + wallThickness / 2, width, wallThickness, {
                isStatic: true,
                render: { visible: false },
                label: 'floor',
            }),
            // 왼쪽
            Matter.Bodies.rectangle(-wallThickness / 2, height / 2, wallThickness, height, {
                isStatic: true,
                render: { visible: false },
            }),
            // 오른쪽
            Matter.Bodies.rectangle(width + wallThickness / 2, height / 2, wallThickness, height, {
                isStatic: true,
                render: { visible: false },
            }),
            // 천장
            Matter.Bodies.rectangle(width / 2, -wallThickness / 2, width, wallThickness, {
                isStatic: true,
                render: { visible: false },
            }),
        ];

        Matter.World.add(engine.world, walls);

        // 카드 생성
        const cardWidth = 160;
        const cardHeight = 100;
        const colors = ['#3b82f6', '#f97316', '#ec4899'];

        recommendations.forEach((rec, index) => {
            const x = width / 2 + (index - 1) * (cardWidth + 20);
            const y = height / 2 + Math.random() * 50 - 25;

            const body = Matter.Bodies.rectangle(x, y, cardWidth, cardHeight, {
                restitution: 0.6,
                friction: 0.1,
                frictionAir: 0.02,
                render: {
                    fillStyle: colors[index % colors.length],
                },
                label: rec.type,
            });

            // 초기 랜덤 속도
            Matter.Body.setVelocity(body, {
                x: (Math.random() - 0.5) * 4,
                y: (Math.random() - 0.5) * 4,
            });

            bodiesRef.current.set(body.id, rec);
            Matter.World.add(engine.world, body);
        });

        // 러너 시작
        const runner = Matter.Runner.create();
        runnerRef.current = runner;
        Matter.Runner.run(runner, engine);
        Matter.Render.run(render);
    }, [recommendations]);

    const startRoulette = useCallback(() => {
        if (!engineRef.current) return;

        setIsRunning(true);
        setSelectedId(null);

        // 무중력 상태에서 물체들 흔들기
        const bodies = Matter.Composite.allBodies(engineRef.current.world).filter(
            (body) => !body.isStatic
        );

        bodies.forEach((body) => {
            Matter.Body.setVelocity(body, {
                x: (Math.random() - 0.5) * 10,
                y: (Math.random() - 0.5) * 10,
            });
        });

        // 2초 후 중력 적용
        setTimeout(() => {
            if (engineRef.current) {
                engineRef.current.gravity.y = 1;
            }

            // 바닥 충돌 감지
            const checkFloor = setInterval(() => {
                if (!engineRef.current) {
                    clearInterval(checkFloor);
                    return;
                }

                const activeBodies = Matter.Composite.allBodies(engineRef.current.world).filter(
                    (body) => !body.isStatic
                );

                // 가장 아래에 있는 물체 찾기
                const lowestBody = activeBodies.reduce((lowest, current) => {
                    return current.position.y > lowest.position.y ? current : lowest;
                }, activeBodies[0]);

                if (lowestBody && lowestBody.velocity.y < 0.5 && lowestBody.position.y > sceneRef.current!.clientHeight - 100) {
                    clearInterval(checkFloor);
                    const winner = bodiesRef.current.get(lowestBody.id);
                    if (winner) {
                        setSelectedId(winner.type);
                        setIsRunning(false);
                        onSelect(winner);
                    }
                }
            }, 100);
        }, 2000);
    }, [onSelect]);

    const cleanup = useCallback(() => {
        if (runnerRef.current) {
            Matter.Runner.stop(runnerRef.current);
            runnerRef.current = null;
        }
        if (renderRef.current) {
            Matter.Render.stop(renderRef.current);
            renderRef.current.canvas.remove();
            renderRef.current = null;
        }
        if (engineRef.current) {
            Matter.Engine.clear(engineRef.current);
            engineRef.current = null;
        }
        bodiesRef.current.clear();
    }, []);

    useEffect(() => {
        return cleanup;
    }, [cleanup]);

    return {
        sceneRef,
        isRunning,
        selectedId,
        initialize,
        startRoulette,
        cleanup,
    };
}

export default useGravityRoulette;
