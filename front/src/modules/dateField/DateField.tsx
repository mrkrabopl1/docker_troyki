import React from 'react';
import DatePicker from 'src/components/input/DatePicker';
import NumInput from 'src/components/input/NumInput';
import s from './style.module.css';

export type ReleasePrecision = 'unknown' | 'year' | 'full';

interface Props {
    precision: ReleasePrecision;
    year: number | null;
    date: string | null;         // 'YYYY-MM-DD'
    onChange: (next: {
        precision: ReleasePrecision;
        year: number | null;
        date: string | null;
    }) => void;
    error?: boolean;
    errorText?: string;
    disabled?: boolean;
}

const MIN_YEAR = 0;
const MAX_YEAR = 2100;

const ReleaseDateField: React.FC<Props> = ({
    precision,
    year,
    date,
    onChange,
    error,
    errorText,
    disabled = false,
}) => {
    const setPrecision = (next: ReleasePrecision) => {
        if (disabled) return;

        if (next === 'unknown') {
            onChange({ precision: next, year: null, date: null });
            return;
        }

        if (next === 'year') {
            onChange({ precision: next, year: year ?? null, date: null });
            return;
        }

        // full: если была дата — оставляем; иначе сеем год в 1 января
        const seed = date ?? (year ? `${year}-01-01` : null);
        const seededYear = year ?? (seed ? Number(seed.slice(0, 4)) : null);
        onChange({ precision: next, year: seededYear, date: seed });
    };

    return (
        <div className={s.root}>
            <label className={s.label}>Дата релиза</label>

            <div className={s.precisionSwitch} role="radiogroup" aria-label="Точность даты релиза">
                <button
                    type="button"
                    disabled={disabled}
                    className={`${s.precisionBtn} ${precision === 'unknown' ? s.active : ''}`}
                    onClick={() => setPrecision('unknown')}
                >
                    Не указывать
                </button>
                <button
                    type="button"
                    disabled={disabled}
                    className={`${s.precisionBtn} ${precision === 'year' ? s.active : ''}`}
                    onClick={() => setPrecision('year')}
                >
                    Только год
                </button>
                <button
                    type="button"
                    disabled={disabled}
                    className={`${s.precisionBtn} ${precision === 'full' ? s.active : ''}`}
                    onClick={() => setPrecision('full')}
                >
                    Полная дата
                </button>
            </div>

            {precision === 'year' && (
                <div className={s.inputWrapper}>
                    <NumInput
                        min={MIN_YEAR}
                        max={MAX_YEAR}
                        value={year ?? 0}
                        onChange={(val) => {
                            if (disabled) return;
                            const normalized = val ? Math.max(MIN_YEAR, Math.min(MAX_YEAR, val)) : null;
                            onChange({ precision, year: normalized, date: null });
                        }}
                        className={error ? s.errorInput : ''}
                    />
                </div>
            )}

            {precision === 'full' && (
                <div className={s.inputWrapper}>
                    <DatePicker
                        value={date ?? ''}
                        minYear={MIN_YEAR}
                        maxYear={MAX_YEAR}
                        onChange={(ymd) => {
                            if (disabled) return;
                            const y = ymd ? Number(ymd.slice(0, 4)) : null;
                            onChange({ precision, year: y, date: ymd || null });
                        }}
                        placeholder="Выберите дату релиза"
                    />
                </div>
            )}

            {error && errorText && <div className={s.errorText}>{errorText}</div>}
        </div>
    );
};

export default ReleaseDateField;