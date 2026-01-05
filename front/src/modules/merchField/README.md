# MerchFieldWithScroll

Компонент для отображения товаров с бесконечным скроллом. Заменяет переключатель страниц на плавный скролл с уведомлениями о позиции.

## Особенности

- **Уведомления о позиции**: Компонент сообщает о позиции скролла родительскому компоненту
- **События скролла**: Коллбеки при достижении низа для загрузки данных
- **Внешняя логика**: Вся логика загрузки данных вынесена на уровень страницы
- **Плавная анимация**: Плавные переходы при скролле
- **Настраиваемый люфт**: Возможность настройки порога загрузки новых данных

## Использование

```tsx
import MerchFieldWithScroll from './MerchFieldWithScroll';

const MyComponent = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleScrollPosition = (position) => {
    // Обработка позиции скролла
    console.log('Scroll position:', position);
  };

  const handleScrollToBottom = () => {
    // Загрузка новых данных при достижении низа
    loadMoreData();
  };

  return (
    <MerchFieldWithScroll
      data={data}
      size={3} // Количество товаров в ряду
      onScrollPosition={handleScrollPosition}
      onScrollToBottom={handleScrollToBottom}
      loading={loading}
    />
  );
};
```

## Props

| Prop | Тип | Обязательный | Описание |
|------|-----|--------------|----------|
| `data` | `MerchInterface[]` | ✅ | Массив товаров для отображения |
| `size` | `number` | ✅ | Количество товаров в ряду |
| `onScrollPosition` | `(position: number) => void` | ❌ | Коллбек при изменении позиции скролла |
| `onScrollToBottom` | `() => void` | ❌ | Коллбек при достижении низа |
| `loading` | `boolean` | ❌ | Состояние загрузки |
| `className` | `string` | ❌ | Дополнительные CSS классы |
| `heightRow` | `number` | ❌ | Высота ряда товаров |

## Интерфейс товара

```tsx
interface MerchInterface {
  name: string;        // Название товара
  imgs: string[];     // Массив URL изображений
  id: string;         // Уникальный идентификатор
  price: string;      // Цена товара
  className?: string; // Дополнительные CSS классы
}
```

## Настройки

### Люфт загрузки
По умолчанию установлен люфт в 200 пикселей. Это означает, что новые данные начнут загружаться за 200px до достижения конца списка.

### Буфер невидимых элементов
Компонент автоматически удаляет невидимые элементы сверху для оптимизации производительности. Размер буфера можно настроить в коде компонента.

## Пример полной реализации

```tsx
import React, { useState, useCallback } from 'react';
import MerchFieldWithScroll from './MerchFieldWithScroll';

const MerchPage = () => {
  const [allData, setAllData] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);

  const loadMoreData = useCallback(async () => {
    if (loading || !hasMore) return;
    
    setLoading(true);
    
    try {
      // API запрос
      const response = await fetch(`/api/merch?page=${currentPage + 1}&limit=12`);
      const newData = await response.json();
      
      setCurrentPage(prev => prev + 1);
      setAllData(prev => [...prev, ...newData]);
      
      // Проверяем, есть ли еще данные
      if (newData.length < 12) {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Ошибка загрузки:', error);
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, currentPage]);

  const handleScrollPosition = useCallback((position) => {
    // Можно добавить аналитику, сохранение позиции и т.д.
    console.log('Scroll position:', position);
  }, []);

  const handleScrollToBottom = useCallback(() => {
    loadMoreData();
  }, [loadMoreData]);

  return (
    <div style={{ height: '600px' }}>
      <MerchFieldWithScroll
        data={allData}
        size={3}
        onScrollPosition={handleScrollPosition}
        onScrollToBottom={handleScrollToBottom}
        loading={loading}
      />
    </div>
  );
};
```

## Архитектура

Компонент состоит из:

1. **MerchFieldWithScroll** - основной компонент с уведомлениями о позиции
2. **InfiniteScroller** - кастомный скроллер с поддержкой событий
3. **MerchBlock** - компонент отображения отдельного товара

## Ключевые принципы

- **Разделение ответственности**: Скроллер только уведомляет о событиях, логика загрузки на уровне страницы
- **Гибкость**: Родительский компонент полностью контролирует загрузку данных
- **Производительность**: Минимальные перерендеры, оптимизированные коллбеки

## Производительность

- Оптимизированные перерендеры с React.memo
- Плавные анимации с CSS transforms
- Минимальная нагрузка на компонент скроллера


