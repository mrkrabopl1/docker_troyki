// pages/admin/site-settings.tsx
import React, { useEffect, useRef, useState } from 'react';
import {
  getSiteSettings,
  uploadSiteLogo,
  updateLogoAlt,
  SiteSettings,
  getFonts,
  createFont,
  setFontRoles,
  FontItem,
} from 'src/providers/adminSiteSettingsProvider';
import s from './siteSettings.style.module.css';

type FontSlot = 'body' | 'display';

const AdminSiteSettings: React.FC = () => {
  // ===== ЛОГОТИП =====
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [alt, setAlt] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // ===== ШРИФТЫ =====
  const [fonts, setFonts] = useState<FontItem[]>([]);
  const [fontsLoading, setFontsLoading] = useState(false);
  const [fontSaving, setFontSaving] = useState(false);

  // роли
  const [bodyId, setBodyId] = useState<number | null>(null);
  const [displayId, setDisplayId] = useState<number | null>(null);

  // какая роль сейчас грузит новый файл (null — никто)
  const [uploadingSlot, setUploadingSlot] = useState<FontSlot | null>(null);
  const bodyFileRef = useRef<HTMLInputElement>(null);
  const displayFileRef = useRef<HTMLInputElement>(null);

  // ===== ОБЩЕЕ =====
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // ============================================================
  // ЗАГРУЗКА
  // ============================================================
  const loadFonts = async () => {
    setFontsLoading(true);
    try {
      await getFonts((data) => setFonts(data));
    } catch {
      setError('Не удалось загрузить шрифты');
    } finally {
      setFontsLoading(false);
    }
  };

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      await getSiteSettings((data) => {
        setSettings(data);
        setAlt(data.logo_alt);
        setBodyId(data.font_body_id ?? null);
        setDisplayId(data.font_display_id ?? null);
      });
      await loadFonts();
    } catch {
      setError('Не удалось загрузить настройки');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // ============================================================
  // ЛОГОТИП
  // ============================================================
  const handleLogoFile = async (file: File) => {
    if (!file) return;
    setUploading(true);
    setError(null);
    setSuccess(null);
    try {
      await uploadSiteLogo(file, alt, (data) => {
        setSettings(data);
        setSuccess('Логотип обновлён');
      });
    } catch (e: any) {
      const msg =
        e?.response?.data?.error ||
        'Ошибка загрузки. Убедитесь, что файл — SVG до 200 КБ.';
      setError(msg);
    } finally {
      setUploading(false);
    }
  };

  const handleSaveAlt = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await updateLogoAlt(alt, (data) => {
        setSettings(data);
        setSuccess('Alt-текст сохранён');
      });
    } catch {
      setError('Не удалось сохранить alt-текст');
    } finally {
      setSaving(false);
    }
  };

  // ============================================================
  // ШРИФТЫ — загрузка нового .woff для конкретной роли
  // ============================================================
  const handleUploadFontForSlot = async (slot: FontSlot, file: File) => {
    if (!file) return;

    // быстрая клиентская проверка
    if (!file.name.toLowerCase().endsWith('.woff')) {
      setError('Только .woff');
      return;
    }
    if (file.size > 200 * 1024) {
      setError('Файл больше 200 КБ');
      return;
    }

    setUploadingSlot(slot);
    setError(null);
    setSuccess(null);

    try {
      // 1. создаём шрифт в библиотеке
      const family = file.name.replace(/\.woff$/i, '').split('-')[0] || 'Custom';
      const slug = family.toLowerCase().replace(/[^a-z0-9]/g, '_');

      await createFont(
        {
          family,
          slug,
          weight: 400,
          style: 'normal',
          file,
        },
        async (created) => {
          // 2. сразу назначаем его ролью
          const nextBody = slot === 'body' ? created.id : bodyId;
          const nextDisplay = slot === 'display' ? created.id : displayId;

          await setFontRoles(nextBody, nextDisplay, (data) => {
            setSettings(data);
            setBodyId(data.font_body_id ?? null);
            setDisplayId(data.font_display_id ?? null);
            setSuccess(
              slot === 'body'
                ? 'Шрифт текста загружен и назначен'
                : 'Шрифт заголовков загружен и назначен'
            );
            loadFonts();
          });
        }
      );
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Ошибка загрузки шрифта');
    } finally {
      setUploadingSlot(null);
    }
  };

  const handleSaveRoles = async () => {
    setFontSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await setFontRoles(bodyId, displayId, (data) => {
        setSettings(data);
        setSuccess('Роли шрифтов сохранены');
      });
    } catch {
      setError('Не удалось сохранить роли шрифтов');
    } finally {
      setFontSaving(false);
    }
  };

  // ============================================================
  // RENDER
  // ============================================================
  const logoPreviewSrc = settings
    ? `${settings.logo_url}?v=${settings.logo_version}`
    : '';

  const renderFontSlot = (
    slot: FontSlot,
    label: string,
    value: number | null,
    setValue: (id: number | null) => void,
    fileRef: React.RefObject<HTMLInputElement>
  ) => (
    <div className={s.field}>
      <label className={s.label}>{label}</label>

      <div className={s.slotRow}>
        <select
          className={s.input}
          value={value ?? ''}
          onChange={(e) => setValue(e.target.value ? Number(e.target.value) : null)}
          disabled={uploadingSlot === slot}
        >
          <option value="">— не выбран (system-ui) —</option>
          {fonts.map((f) => (
            <option key={f.id} value={f.id}>
              {f.family} {f.weight} {f.style}
            </option>
          ))}
        </select>

        <button
          type="button"
          className={s.smallUploadBtn}
          onClick={() => fileRef.current?.click()}
          disabled={uploadingSlot === slot}
        >
          {uploadingSlot === slot ? 'Загрузка...' : 'Загрузить .woff'}
        </button>

        <input
          ref={fileRef}
          type="file"
          accept=".woff,font/woff,application/font-woff"
          style={{ display: 'none' }}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleUploadFontForSlot(slot, f);
            e.target.value = '';
          }}
        />
      </div>

      <div className={s.hint}>
        Выберите из загруженных или загрузите свой .woff (до 200 КБ).
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className={s.page}>
        <div className={s.loader}>Загрузка...</div>
      </div>
    );
  }

  return (
    <div className={s.page}>
      <h2 className={s.title}>Настройки сайта</h2>

      {error && <div className={s.error}>{error}</div>}
      {success && <div className={s.success}>{success}</div>}

      {/* ============================================================ */}
      {/* ЛОГОТИП */}
      {/* ============================================================ */}
      <section className={s.card}>
        <h3 className={s.cardTitle}>Логотип</h3>

        <div className={s.logoRow}>
          <div className={s.preview}>
            {settings?.logo_url ? (
              <img
                src={logoPreviewSrc}
                alt={settings.logo_alt}
                className={s.logoImg}
              />
            ) : (
              <div className={s.previewEmpty}>Нет логотипа</div>
            )}
          </div>

          <div className={s.logoControls}>
            <button
              type="button"
              className={s.uploadBtn}
              onClick={() => logoInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? 'Загрузка...' : 'Заменить логотип'}
            </button>
            <div className={s.hint}>
              Только SVG, до 200 КБ.
              <br />
              Новый файл получит уникальное имя — кеш сбросится автоматически.
            </div>
            <input
              ref={logoInputRef}
              type="file"
              accept=".svg,image/svg+xml"
              style={{ display: 'none' }}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleLogoFile(f);
                e.target.value = '';
              }}
            />
          </div>
        </div>

        <div className={s.field}>
          <label className={s.label}>Alt-текст (для доступности)</label>
          <input
            type="text"
            className={s.input}
            value={alt}
            onChange={(e) => setAlt(e.target.value)}
            maxLength={255}
            placeholder="TROYKI_BENCH"
          />
          <div className={s.hint}>
            Что прочитает скринридер вместо картинки. Если рядом с логотипом
            уже есть текст «TROYKI_BENCH» — оставьте поле пустым.
          </div>
        </div>

        <button
          type="button"
          className={s.saveBtn}
          onClick={handleSaveAlt}
          disabled={saving || alt === settings?.logo_alt}
        >
          {saving ? 'Сохранение...' : 'Сохранить alt-текст'}
        </button>

        {settings && (
          <div className={s.meta}>
            <span>Версия: {settings.logo_version}</span>
          </div>
        )}
      </section>

      {/* ============================================================ */}
      {/* ШРИФТЫ */}
      {/* ============================================================ */}
      <section className={s.card} style={{ marginTop: 24 }}>
        <h3 className={s.cardTitle}>Шрифты</h3>

        {fontsLoading ? (
          <div className={s.hint}>Загрузка...</div>
        ) : (
          <>
            <div className={s.rolesRow}>
              {renderFontSlot(
                'body',
                'Шрифт текста (body)',
                bodyId,
                setBodyId,
                bodyFileRef
              )}
              {renderFontSlot(
                'display',
                'Шрифт заголовков (display)',
                displayId,
                setDisplayId,
                displayFileRef
              )}
            </div>

            <button
              type="button"
              className={s.saveBtn}
              onClick={handleSaveRoles}
              disabled={fontSaving}
            >
              {fontSaving ? 'Сохранение...' : 'Сохранить роли'}
            </button>

            {fonts.length > 0 && (
              <div className={s.fontsPreviewBlock}>
                <h4 className={s.subTitle}>Предпросмотр шрифтов</h4>
                {fonts.map((f) => (
                  <div
                    key={f.id}
                    className={s.fontPreviewRow}
                    style={{ fontFamily: `'${f.family}', sans-serif` }}
                  >
                    <span className={s.fontPreviewName}>
                      {f.family} {f.weight} {f.style}
                    </span>
                    <span className={s.fontPreviewText}>
                      Съешь ещё этих мягких французских булок
                    </span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
};

export default AdminSiteSettings;