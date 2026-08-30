// lib/navigationDiagnostic.ts

export function logNavStart(page: string, context?: string) {
  if (typeof window !== 'undefined') {
    const timestamp = performance.now();
    const key = `nav_${page}_${Date.now()}`;
    
    // Сохраняем время начала
    sessionStorage.setItem('nav_start', String(timestamp));
    sessionStorage.setItem('nav_page', page);
    
    console.log(`🚀 [НАВИГАЦИЯ] Начало перехода на: ${page}`);
    console.log(`   📍 Текущий URL: ${window.location.pathname}`);
    console.log(`   ⏱️ Время: ${timestamp.toFixed(0)}ms`);
    
    if (context) {
      console.log(`   📝 Контекст: ${context}`);
    }
    
    // Логируем состояние React
    console.log('   🔄 Состояние приложения:');
    console.log(`      - document.readyState: ${document.readyState}`);
    console.log(`      - window.performance.navigation.type: ${window.performance?.navigation?.type}`);
    
    return key;
  }
}

export function logNavEnd(page: string, startKey?: string) {
  if (typeof window !== 'undefined') {
    const endTime = performance.now();
    const startTime = sessionStorage.getItem('nav_start');
    
    if (startTime) {
      const duration = endTime - parseFloat(startTime);
      console.log(`✅ [НАВИГАЦИЯ] Завершено: ${page}`);
      console.log(`   ⏱️ Длительность: ${duration.toFixed(0)}ms`);
      
      // Анализируем задержку
      if (duration > 2000) {
        console.warn(`⚠️ [НАВИГАЦИЯ] КРИТИЧЕСКАЯ ЗАДЕРЖКА! > 2 секунды`);
        console.warn(`   💡 Возможные причины:`);
        console.warn(`      - Тяжёлые вычисления в getServerSideProps`);
        console.warn(`      - Большой объём данных в initialData`);
        console.warn(`      - Блокирующие запросы в useEffect`);
        console.warn(`      - Проблемы с гидратацией`);
      }
    }
  }
}

// Добавляем в _app.tsx для отслеживания всех переходов
export function setupNavigationMonitoring() {
  if (typeof window !== 'undefined') {
    // Отслеживаем изменение URL через History API
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;
    
    history.pushState = function(...args) {
      console.log(`🔄 [ROUTER] pushState вызван`);
      console.log(`   📍 URL: ${args[2]}`);
      logNavStart(String(args[2]), 'pushState');
      return originalPushState.apply(this, args);
    };
    
    history.replaceState = function(...args) {
      console.log(`🔄 [ROUTER] replaceState вызван`);
      console.log(`   📍 URL: ${args[2]}`);
      return originalReplaceState.apply(this, args);
    };
    
    // Отслеживаем загрузку страницы
    window.addEventListener('load', () => {
      console.log(`📄 [PAGE] Страница загружена: ${window.location.pathname}`);
      logNavEnd(window.location.pathname);
    });
  }
}