import React, { memo, useCallback, useState, useEffect, useRef, useMemo } from 'react';
import s from './datePicker.module.css';

interface DatePickerProps {
    value?: string;              // 'YYYY-MM-DD'
    onChange?: (value: string) => void;
    placeholder?: string;
    name?: string;
    minYear?: number;
    maxYear?: number;
}

const toYMD = (d: Date): string => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
};

const normalizeYMD = (v?: string): string => {
    if (!v) return '';
    return v.length >= 10 ? v.slice(0, 10) : v;
};

// Формат для отображения в инпуте
const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    return `${day}.${month}.${year}`;
};

// Парсинг ввода: 'ДД.ММ.ГГГГ', 'ДД/ММ/ГГГГ', 'ГГГГ-ММ-ДД', 'ДД.ММ.ГГ'
const parseInput = (raw: string): string | null => {
    const v = raw.trim();
    if (!v) return '';

    // YYYY-MM-DD или YYYY.MM.DD
    let m = v.match(/^(\d{4})[-./](\d{1,2})[-./](\d{1,2})$/);
    if (m) {
        const [, y, mo, d] = m;
        return buildYMD(+y, +mo, +d);
    }

    // DD.MM.YYYY / DD/MM/YYYY / DD-MM-YYYY / DD.MM.YY
    m = v.match(/^(\d{1,2})[-./](\d{1,2})[-./](\d{2,4})$/);
    if (m) {
        const [, d, mo, yRaw] = m;
        let y = +yRaw;
        if (yRaw.length === 2) {
            y = y < 70 ? 2000 + y : 1900 + y; // 00..69 → 20xx, 70..99 → 19xx
        }
        return buildYMD(y, +mo, +d);
    }

    // 8 цифр подряд: DDMMYYYY
    m = v.match(/^(\d{2})(\d{2})(\d{4})$/);
    if (m) {
        const [, d, mo, y] = m;
        return buildYMD(+y, +mo, +d);
    }

    return null;
};

const buildYMD = (y: number, m: number, d: number): string | null => {
    if (m < 1 || m > 12 || d < 1 || d > 31) return null;
    const dt = new Date(y, m - 1, d);
    // проверка на «переполнение» (31.02 → 03.03)
    if (dt.getFullYear() !== y || dt.getMonth() !== m - 1 || dt.getDate() !== d) return null;
    return toYMD(dt);
};

const DatePicker: React.FC<DatePickerProps> = memo(({
    value = '',
    onChange,
    placeholder = 'ДД.ММ.ГГГГ',
    name,
    minYear = 1900,
    maxYear = 2100,
}) => {
    const [selectedDate, setSelectedDate] = useState(normalizeYMD(value));
    const [inputText, setInputText] = useState(formatDate(normalizeYMD(value)));
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

    // синхронизация с внешним value
    useEffect(() => {
        const normalized = normalizeYMD(value);
        setSelectedDate(normalized);
        setInputText(formatDate(normalized));
        if (normalized) {
            const [y, m] = normalized.split('-').map(Number);
            setCurrentMonth(new Date(y, m - 1, 1));
        }
    }, [value]);

    // клик вне — закрыть
    useEffect(() => {
        const handler = (e: MouseEvent | TouchEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        document.addEventListener('touchstart', handler);
        return () => {
            document.removeEventListener('mousedown', handler);
            document.removeEventListener('touchstart', handler);
        };
    }, []);

    const commitValue = useCallback((ymd: string) => {
        setSelectedDate(ymd);
        setInputText(formatDate(ymd));
        onChange?.(ymd);
    }, [onChange]);

    const handleDateSelect = useCallback((date: Date) => {
        commitValue(toYMD(date));
        setIsOpen(false);
    }, [commitValue]);

    const handleClear = useCallback(() => {
        commitValue('');
        setIsOpen(false);
    }, [commitValue]);

    const handleToday = useCallback(() => {
        const today = new Date();
        setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1));
        handleDateSelect(today);
    }, [handleDateSelect]);

    // ручной ввод
    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setInputText(e.target.value);
    }, []);

    const handleInputBlur = useCallback(() => {
        const parsed = parseInput(inputText);
        if (parsed === null) {
            // невалидно — откатываем к последнему валидному
            setInputText(formatDate(selectedDate));
            return;
        }
        if (parsed === '') {
            commitValue('');
            return;
        }
        const [y, m] = parsed.split('-').map(Number);
        if (y < minYear || y > maxYear) {
            setInputText(formatDate(selectedDate));
            return;
        }
        commitValue(parsed);
        setCurrentMonth(new Date(y, m - 1, 1));
    }, [inputText, selectedDate, minYear, maxYear, commitValue]);

    const handleInputKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            (e.target as HTMLInputElement).blur();
        } else if (e.key === 'Escape') {
            setInputText(formatDate(selectedDate));
            setIsOpen(false);
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            setIsOpen(true);
        }
    }, [selectedDate]);

    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const days: (Date | null)[] = [];

        const jsDay = firstDay.getDay();
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

    const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), +e.target.value, 1));
    };

    const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setCurrentMonth(new Date(+e.target.value, currentMonth.getMonth(), 1));
    };

    const years = useMemo(() => {
        const arr: number[] = [];
        for (let y = maxYear; y >= minYear; y--) arr.push(y);
        return arr;
    }, [minYear, maxYear]);

    const months = [
        'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
        'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
    ];

    const days = getDaysInMonth(currentMonth);
    const weekDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

    return (
        <div ref={containerRef} className={s.datePickerContainer}>
            <input
                type="text"
                name={name}
                value={inputText}
                onChange={handleInputChange}
                onBlur={handleInputBlur}
                onKeyDown={handleInputKeyDown}
                onFocus={() => setIsOpen(true)}
                placeholder={placeholder}
                className={s.datePickerInput}
                inputMode="numeric"
                autoComplete="off"
            />

            {isOpen && (
                <div className={s.calendar}>
                    <div className={s.calendarHeader}>
                        <button onClick={prevMonth} type="button" aria-label="Предыдущий месяц">&lt;</button>

                        <div className={s.selectors}>
                            <select
                                value={currentMonth.getMonth()}
                                onChange={handleMonthChange}
                                className={s.select}
                                aria-label="Месяц"
                            >
                                {months.map((m, i) => (
                                    <option key={m} value={i}>{m}</option>
                                ))}
                            </select>

                            <select
                                value={currentMonth.getFullYear()}
                                onChange={handleYearChange}
                                className={s.select}
                                aria-label="Год"
                            >
                                {years.map(y => (
                                    <option key={y} value={y}>{y}</option>
                                ))}
                            </select>
                        </div>

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