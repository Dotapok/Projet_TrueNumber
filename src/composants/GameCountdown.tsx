import { useState, useEffect } from 'react';

export default function GameCountdown({
    timeLimit,
    onTimeout
}: {
    timeLimit: number;
    onTimeout: () => void;
}) {
    const [timeLeft, setTimeLeft] = useState(timeLimit);

    useEffect(() => {
        if (timeLeft <= 0) {
            onTimeout();
            return;
        }

        const timer = setInterval(() => {
            setTimeLeft(prev => prev - 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [timeLeft, onTimeout]);

    return (
        <div className="mb-4">
            <p className="font-semibold">
                Temps restant: <span className={timeLeft <= 10 ? 'text-red-600' : ''}>
                    {timeLeft}s
                </span>
            </p>
            <div className="w-full bg-gray-200 rounded h-2">
                <div
                    className={`h-2 rounded ${timeLeft <= 10 ? 'bg-red-600' : 'bg-green-600'}`}
                    style={{ width: `${(timeLeft / timeLimit) * 100}%` }}
                ></div>
            </div>
        </div>
    );
}