import { useEffect, useRef, useState } from 'react';

interface RollingNumberProps {
  value: number;
  decimals?: number;
  className?: string;
  showSign?: boolean;
}

interface DigitState {
  current: string;
  isFlickering: boolean;
}

export function RollingNumber({ value, decimals = 0, className = '', showSign = false }: RollingNumberProps) {
  const [digits, setDigits] = useState<DigitState[]>([]);
  const prevValueRef = useRef(value);
  const timersRef = useRef<NodeJS.Timeout[]>([]);

  // Handle sign for deficit values
  const sign = showSign ? (value > 0 ? '+' : value < 0 ? '-' : '') : '';

  useEffect(() => {
    // Use absolute value for formatting to avoid negative sign in string
    const absValue = Math.abs(value);
    const formattedValue = absValue.toFixed(decimals);
    const targetDigits = formattedValue.split('');

    // Initialize digits if first render
    if (digits.length === 0) {
      setDigits(targetDigits.map(d => ({ current: d, isFlickering: false })));
      prevValueRef.current = value;
      return;
    }

    // Only animate if value actually changed
    if (prevValueRef.current === value) {
      return;
    }

    // Clear any existing timers
    timersRef.current.forEach(timer => clearTimeout(timer));
    timersRef.current = [];

    // Handle digit count changes - reset to new value immediately
    if (targetDigits.length !== digits.length) {
      setDigits(targetDigits.map(d => ({ current: d, isFlickering: false })));
      prevValueRef.current = value;
      return;
    }

    const newDigits = [...digits];

    // Animate each digit with fade out/in (left to right, all digits animate)
    targetDigits.forEach((targetDigit, index) => {
      // Skip animation for decimal points only
      if (targetDigit === '.') {
        newDigits[index] = { current: targetDigit, isFlickering: false };
        return;
      }

      // Stagger delay - left to right (50ms per digit)
      const startDelay = index * 50;

      // Fade out duration
      const fadeOutDuration = 100;

      // Fade in duration
      const fadeInDuration = 100;

      // Start animation after staggered delay
      const startTimer = setTimeout(() => {
        // Start fade out
        newDigits[index].isFlickering = true;
        setDigits([...newDigits]);

        // Change the digit value at the midpoint (when fully faded out)
        const changeTimer = setTimeout(() => {
          newDigits[index].current = targetDigit;
          setDigits([...newDigits]);
        }, fadeOutDuration);

        timersRef.current.push(changeTimer);

        // End fade in (stop flickering class)
        const endTimer = setTimeout(() => {
          newDigits[index].isFlickering = false;
          setDigits([...newDigits]);
        }, fadeOutDuration + fadeInDuration);

        timersRef.current.push(endTimer);
      }, startDelay);

      timersRef.current.push(startTimer);
    });

    prevValueRef.current = value;

    return () => {
      timersRef.current.forEach(timer => clearTimeout(timer));
      timersRef.current = [];
    };
  }, [value, decimals]);

  return (
    <span className={`inline-flex ${className}`}>
      {sign && <span className="rolling-digit-wrapper">{sign}</span>}
      {digits.map((digit, index) => {
        const isDecimalPoint = digit.current === '.';

        return (
          <span
            key={index}
            className={`rolling-digit-wrapper ${isDecimalPoint ? 'decimal-point' : ''}`}
          >
            <span className={`rolling-digit ${digit.isFlickering ? 'flickering' : ''}`}>
              {digit.current}
            </span>
          </span>
        );
      })}
    </span>
  );
}
