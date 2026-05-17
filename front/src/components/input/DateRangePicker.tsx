import React, { useRef, useState, useEffect, useCallback } from 'react';
import s from "./dateRangePicker.module.css";
import InputWithLabel from './InputWithLabel';

type DateRange = {
    from: string;
    to: string;
};

type DateRangePickerProps = {
    onChange: (range: DateRange) => void;
    onFocus?: () => void;
    onBlur?: () => void;
    className?: string;
    placeholderFrom?: string;
    placeholderTo?: string;
    initialFrom?: string;
    initialTo?: string;
    minDate?: string;
    maxDate?: string;
    format?: string; // 'YYYY-MM-DD' по умолчанию
};

const DateRangePicker: React.FC<DateRangePickerProps> = ({
    onChange,
    onFocus,
    onBlur,
    className = '',
    placeholderFrom = 'Дата от',
    placeholderTo = 'Дата до',
    initialFrom = '',
    initialTo = '',
    minDate,
    maxDate,
    format = 'YYYY-MM-DD'
}) => {
    const [dateFrom, setDateFrom] = useState(initialFrom);
    const [dateTo, setDateTo] = useState(initialTo);
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Синхронизация с внешними значениями
    useEffect(() => {
        setDateFrom(initialFrom);
    }, [initialFrom]);

    useEffect(() => {
        setDateTo(initialTo);
    }, [initialTo]);

    // Закрытие календаря при клике вне компонента
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleDateFromChange = useCallback((value: string) => {
        setDateFrom(value);
        onChange({ from: value, to: dateTo });
    }, [dateTo, onChange]);

    const handleDateToChange = useCallback((value: string) => {
        setDateTo(value);
        onChange({ from: dateFrom, to: value });
    }, [dateFrom, onChange]);

    const handleFocus = useCallback(() => {
        setIsOpen(true);
        onFocus?.();
    }, [onFocus]);

    const handleBlur = useCallback(() => {
        onBlur?.();
    }, [onBlur]);

    // Быстрые выборы
    const setToday = useCallback(() => {
        const today = new Date().toISOString().split('T')[0];
        setDateFrom(today);
        setDateTo(today);
        onChange({ from: today, to: today });
    }, [onChange]);

    const setYesterday = useCallback(() => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        setDateFrom(yesterdayStr);
        setDateTo(yesterdayStr);
        onChange({ from: yesterdayStr, to: yesterdayStr });
    }, [onChange]);

    const setLastWeek = useCallback(() => {
        const to = new Date();
        const from = new Date();
        from.setDate(from.getDate() - 7);
        
        const fromStr = from.toISOString().split('T')[0];
        const toStr = to.toISOString().split('T')[0];
        
        setDateFrom(fromStr);
        setDateTo(toStr);
        onChange({ from: fromStr, to: toStr });
    }, [onChange]);

    const setLastMonth = useCallback(() => {
        const to = new Date();
        const from = new Date();
        from.setMonth(from.getMonth() - 1);
        
        const fromStr = from.toISOString().split('T')[0];
        const toStr = to.toISOString().split('T')[0];
        
        setDateFrom(fromStr);
        setDateTo(toStr);
        onChange({ from: fromStr, to: toStr });
    }, [onChange]);

    const clearDates = useCallback(() => {
        setDateFrom('');
        setDateTo('');
        onChange({ from: '', to: '' });
    }, [onChange]);

    return (
        <div ref={containerRef} className={`${s.dateRangePicker} ${className}`}>
            <div className={s.dateInputs}>
                <InputWithLabel
                    val={dateFrom}
                    onChange={handleDateFromChange}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    placeholder={placeholderFrom}
                    className={s.dateInput}
                />
                <span className={s.separator}>—</span>
                <InputWithLabel
                    val={dateTo}
                    onChange={handleDateToChange}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    placeholder={placeholderTo}
                    className={s.dateInput}
                />
            </div>
            
            {isOpen && (
                <div className={s.calendarPopup}>
                    <div className={s.quickButtons}>
                        <button onClick={setToday} type="button">Сегодня</button>
                        <button onClick={setYesterday} type="button">Вчера</button>
                        <button onClick={setLastWeek} type="button">Последние 7 дней</button>
                        <button onClick={setLastMonth} type="button">Последний месяц</button>
                        <button onClick={clearDates} type="button">Очистить</button>
                    </div>
                    
                    <div className={s.calendarContainer}>
                        <SimpleCalendar
                            selectedDate={dateFrom}
                            onChange={handleDateFromChange}
                            minDate={minDate}
                            maxDate={maxDate}
                            title="Дата от"
                        />
                        <SimpleCalendar
                            selectedDate={dateTo}
                            onChange={handleDateToChange}
                            minDate={minDate}
                            maxDate={maxDate}
                            title="Дата до"
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

// Простой календарь
type SimpleCalendarProps = {
    selectedDate: string;
    onChange: (date: string) => void;
    minDate?: string;
    maxDate?: string;
    title?: string;
};

const SimpleCalendar: React.FC<SimpleCalendarProps> = ({
    selectedDate,
    onChange,
    minDate,
    maxDate,
    title
}) => {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    
    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const days = [];
        
        // Добавляем пустые дни для начала месяца
        for (let i = 0; i < firstDay.getDay(); i++) {
            days.push(null);
        }
        
        // Добавляем дни месяца
        for (let i = 1; i <= lastDay.getDate(); i++) {
            days.push(new Date(year, month, i));
        }
        
        return days;
    };
    
    const isDateDisabled = (date: Date) => {
        const dateStr = date.toISOString().split('T')[0];
        if (minDate && dateStr < minDate) return true;
        if (maxDate && dateStr > maxDate) return true;
        return false;
    };
    
    const handleDateClick = (date: Date) => {
        if (!isDateDisabled(date)) {
            onChange(date.toISOString().split('T')[0]);
        }
    };
    
    const prevMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
    };
    
    const nextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
    };
    
    const days = getDaysInMonth(currentMonth);
    const weekDays = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
    
    return (
        <div className={s.calendar}>
            <div className={s.calendarHeader}>
                {title && <h4>{title}</h4>}
                <div className={s.monthNavigation}>
                    <button onClick={prevMonth} type="button">&lt;</button>
                    <span>{currentMonth.toLocaleString('ru', { month: 'long', year: 'numeric' })}</span>
                    <button onClick={nextMonth} type="button">&gt;</button>
                </div>
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
                    
                    const dateStr = day.toISOString().split('T')[0];
                    const isSelected = dateStr === selectedDate;
                    const isDisabled = isDateDisabled(day);
                    
                    return (
                        <button
                            key={dateStr}
                            className={`${s.day} ${isSelected ? s.selected : ''} ${isDisabled ? s.disabled : ''}`}
                            onClick={() => handleDateClick(day)}
                            disabled={isDisabled}
                            type="button"
                        >
                            {day.getDate()}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default React.memo(DateRangePicker);