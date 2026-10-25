import React, { memo, useCallback, useState, useEffect, useRef } from 'react';
import s from './datePicker.module.css';

interface DatePickerProps {
    value?: string;              // 'YYYY-MM-DD' (на входе допускается ISO — нормализуем)
    onChange?: (value: string) => void; // 'YYYY-MM-DD' или '' при очистке
    placeholder?: string;
    name?: string;
    minYear?: number;
    maxYear?: number;
}

// Локальное форматирование в 'YYYY-MM-DD' (без UTC-сдвига)
const toYMD = (d: Date): string => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
};

// Нормализация входа: '2025-03-01T00:00:00Z' → '2025-03-01'
const normalizeYMD = (v?: string): string => {
    if (!v) return '';
    return v.length >= 10 ? v.slice(0, 10) : v;
};

const DatePicker: React.FC<DatePickerProps> = memo(({
    value = '',
    onChange,
    placeholder = 'Выберите дату',
    name,
    minYear = 1900,
    maxYear = 2100,
}) => {
    const [selectedDate, setSelectedDate] = useState(normalizeYMD(value));
    const [isOpen, setIsOpen] = useState(false);
    const [currentMonth, setCurrentMonth] = useState(() => {
        const n = normalizeYMD(value);
        if (n) {
            const [y, m] = n.split('-').map(Number);
            return new Date(y, m - 1, 1);
        }
        return new Date();
    });
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const normalized = normalizeYMD(value);
        setSelectedDate(normalized);
        if (normalized) {
            const [y, m] = normalized.split('-').map(Number);
            setCurrentMonth(new Date(y, m - 1, 1));
        }
    }, [value]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleDateSelect = useCallback((date: Date) => {
        const ymd = toYMD(date);
        setSelectedDate(ymd);
        onChange?.(ymd);
        setIsOpen(false);
    }, [onChange]);

    const handleClear = useCallback(() => {
        setSelectedDate('');
        onChange?.('');
        setIsOpen(false);
    }, [onChange]);

    const handleToday = useCallback(() => {
        const today = new Date();
        setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1));
        handleDateSelect(today);
    }, [handleDateSelect]);

    const formatDate = (dateStr: string) => {
        if (!dateStr) return '';
        const [year, month, day] = dateStr.split('-');
        return `${day}.${month}.${year}`;
    };

    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const days: (Date | null)[] = [];

        // Пн=0, Вс=6 (европейский порядок)
        const jsDay = firstDay.getDay(); // 0=Вс..6=Сб
        const leading = (jsDay + 6) % 7;
        for (let i = 0; i < leading; i++) days.push(null);

        for (let i = 1; i <= lastDay.getDate(); i++) {
            days.push(new Date(year, month, i));
        }
        return days;
    };

    const prevMonth = () => {
        const prev = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
        if (prev.getFullYear() >= minYear) setCurrentMonth(prev);
    };

    const nextMonth = () => {
        const next = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
        if (next.getFullYear() <= maxYear) setCurrentMonth(next);
    };

    const days = getDaysInMonth(currentMonth);
    const weekDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

    return (
        <div ref={containerRef} className={s.datePickerContainer}>
            <input
                type="text"
                name={name}
                value={formatDate(selectedDate)}
                onFocus={() => setIsOpen(true)}
                placeholder={placeholder}
                className={s.datePickerInput}
                readOnly
            />

            {isOpen && (
                <div className={s.calendar}>
                    <div className={s.calendarHeader}>
                        <button onClick={prevMonth} type="button" aria-label="Предыдущий месяц">&lt;</button>
                        <span>{currentMonth.toLocaleString('ru', { month: 'long', year: 'numeric' })}</span>
                        <button onClick={nextMonth} type="button" aria-label="Следующий месяц">&gt;</button>
                    </div>

                    <div className={s.weekDays}>
                        {weekDays.map(day => (
                            <span key={day} className={s.weekDay}>{day}</span>
                        ))}
                    </div>

                    <div className={s.days}>
                        {days.map((day, index) => {
                            if (!day) {
                                return <div key={`empty-${index}`} className={s.emptyDay} />;
                            }

                            const dateStr = toYMD(day);
                            const isSelected = dateStr === selectedDate;
                            const isToday = dateStr === toYMD(new Date());

                            return (
                                <button
                                    key={dateStr}
                                    className={`${s.day} ${isSelected ? s.selected : ''} ${isToday ? s.today : ''}`}
                                    onClick={() => handleDateSelect(day)}
                                    type="button"
                                >
                                    {day.getDate()}
                                </button>
                            );
                        })}
                    </div>

                    <div className={s.calendarFooter}>
                        <button type="button" className={s.footerBtn} onClick={handleToday}>Сегодня</button>
                        <button type="button" className={s.footerBtn} onClick={handleClear}>Очистить</button>
                    </div>
                </div>
            )}
        </div>
    );
});

DatePicker.displayName = 'DatePicker';

export default DatePicker;