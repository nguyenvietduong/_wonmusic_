import { useInView } from "framer-motion";
import { useEffect, useRef, useState, useImperativeHandle, forwardRef } from "react";

interface CountUpProps {
    value: number;
}

export interface CountUpRef {
    start: () => void;
}

// Easing: ease out expo
const easeOutExpo = (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));

const CountUp = forwardRef<CountUpRef, CountUpProps>(({ value }, ref) => {
    const spanRef = useRef<HTMLSpanElement>(null);
    const isInView = useInView(spanRef, { once: false, amount: 0.5 });
    const [displayValue, setDisplayValue] = useState(0);
    const rafRef = useRef<number | null>(null);

    const runAnimation = () => {
        // Hủy animation cũ
        if (rafRef.current) cancelAnimationFrame(rafRef.current);

        const duration = 2000; // ms
        const startTime = performance.now();

        const tick = (now: number) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = easeOutExpo(progress);

            setDisplayValue(Math.round(eased * value));

            if (progress < 1) {
                rafRef.current = requestAnimationFrame(tick);
            }
        };

        setDisplayValue(0);
        rafRef.current = requestAnimationFrame(tick);
    };

    useImperativeHandle(ref, () => ({ start: runAnimation }));

    useEffect(() => {
        if (isInView) {
            runAnimation();
        } else {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
            setDisplayValue(0);
        }

        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, [isInView, value]);

    return (
        <p className="text-[40px] font-extrabold text-[#0b2a59] tabular-nums tracking-tight">
            <span ref={spanRef}>
                {displayValue.toLocaleString()}
            </span>
            <span className="text-green-600 ml-1">+</span>
        </p>
    );
});

CountUp.displayName = "CountUp";
export default CountUp;