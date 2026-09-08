import type { appDispatchType } from '@/redux/sotre';
import { logoutUser } from '@/redux/thunks/userThunks';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useDispatch } from 'react-redux';

export type destroySessionPropsTypes = {
    title: string;
    subtitle?: string;
    type?: 'SESSION_INACTIVITY' | 'DEFAULT';
    duration?: number;
    onCancel?: () => void;
};

export default function DestroySession({
    title,
    subtitle = 'Redirecting, logging you out...',
    type = 'DEFAULT',
    duration = 10,
    onCancel,
}: destroySessionPropsTypes) {
    const dispatch = useDispatch<appDispatchType>();

    const initialDuration = type === 'SESSION_INACTIVITY' ? 60 : duration;

    const [timeLeft, setTimeLeft] = useState(initialDuration);

    const handleLogout = () => {
        dispatch(logoutUser());
    };

    useEffect(() => {
        if (timeLeft <= 0) {
            handleLogout();
            return;
        }

        const timer = setTimeout(() => {
            setTimeLeft((previous) => previous - 1);
        }, 1000);

        return () => clearTimeout(timer);
    }, [timeLeft]);

    const handleCancel = () => {
        onCancel?.();
    };

    const progressPercent = ((initialDuration - timeLeft) / initialDuration) * 100;

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-gray-100">
            <div className="text-center p-6!">
                <h1 className="text-2xl font-bold mb-2!">
                    {title}
                </h1>

                <p className="text-gray-700 mb-4!">
                    {subtitle}
                </p>

                <div className="w-full bg-gray-300 h-2 rounded mb-4!">
                    <div
                        className="bg-blue-500 h-2 rounded transition-all duration-1000"
                        style={{
                            width: `${progressPercent}%`,
                        }}
                    />
                </div>

                <p className="text-sm text-gray-600 mb-6!">
                    Redirecting in {timeLeft} seconds...
                </p>

                <div className="flex gap-4 justify-center">
                    {type === 'SESSION_INACTIVITY' && (
                        <button
                            type="button"
                            onClick={handleCancel}
                            className="
                                px-4! py-2!
                                bg-gray-400
                                text-white
                                rounded
                                hover:bg-gray-500
                                cursor-pointer
                            "
                        >
                            Continue
                        </button>
                    )}

                    <button
                        type="button"
                        onClick={handleLogout}
                        className="
                            px-4! py-2!
                            bg-red-500
                            text-white
                            rounded
                            hover:bg-red-600
                            cursor-pointer
                        "
                    >
                        Logout
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}