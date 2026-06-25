import React, { memo, useCallback, useState, useEffect, useRef } from 'react';
import s from './datePicker.module.css';

interface DatePickerProps {
    value?: string;
    onChange?: (value: string) => void;
    placeholder?: string;
    name?: string;
}

const DatePicker: React.FC<DatePickerProps> = memo(({
    value = '',
    onChange,
    placeholder = 'Выберите дату',
    name
}) => {
    const [selectedDate, setSelectedDate] = useState(value);
    const [isOpen, setIsOpen] = useState(false);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setSelectedDate(value);
        if (value) {
            setCurrentMonth(new Date(value));
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
        const dateStr = date.toISOString();
        setSelectedDate(dateStr.split('T')[0]);
        onChange?.(dateStr);
        setIsOpen(false);
    }, [onChange]);

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
        const days = [];
        
        for (let i = 0; i < firstDay.getDay(); i++) {
            days.push(null);
        }
        
        for (let i = 1; i <= lastDay.getDate(); i++) {
            days.push(new Date(year, month, i));
        }
        
        return days;
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
                        <button onClick={prevMonth} type="button">&lt;</button>
                        <span>{currentMonth.toLocaleString('ru', { month: 'long', year: 'numeric' })}</span>
                        <button onClick={nextMonth} type="button">&gt;</button>
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
                            
                            return (
                                <button
                                    key={dateStr}
                                    className={`${s.day} ${isSelected ? s.selected : ''}`}
                                    onClick={() => handleDateSelect(day)}
                                    type="button"
                                >
                                    {day.getDate()}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
});

export default DatePicker;