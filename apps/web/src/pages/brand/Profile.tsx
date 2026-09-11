import { useCallback, useEffect, useState } from 'react';
import type { AxiosInstance } from 'axios';
import { Plus, Trash2, Check } from 'lucide-react';
import api from '../../lib/api';
import FormField from '../../components/FormField';
import LoadingSpinner from '../../components/LoadingSpinner';
import type { BrandPillar, BrandProfile } from '@meos/shared';

const FIELDS: { key: keyof BrandProfile; label: string; textarea?: boolean; placeholder: string }[] = [
  { key: 'mission', label: '定位宣言', textarea: true, placeholder: '我为谁提供什么独特价值？' },
  { key: 'positioning', label: '一句话定位', placeholder: '如：帮创业者用系统经营人生' },
  { key: 'slogan', label: 'Slogan', placeholder: '如：用系统经营人生' },
  { key: 'personaTags', label: '人设关键词', placeholder: '逗号分隔，如：系统思维、长期主义、builder' },
  { key: 'targetAudience', label: '目标受众', textarea: true, placeholder: '他们在乎什么？在哪里？' },
  { key: 'toneOfVoice', label: '语调规范', textarea: true, placeholder: '理性、直接、有温度；避免夸大' },
  { key: 'visualNotes', label: '视觉规范', textarea: true, placeholder: '头像、配色、字体等约定' },
];

export default function Profile() {
  const [profile, setProfile] = useState<Partial<BrandProfile>>({});
  const [pillars, setPillars] = useState<BrandPillar[]>([]);
  const [newPillar, setNewPillar] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  const load = useCallback(async () => {
    try {
      const [profileRes, pillarsRes] = await Promise.all([
        api.get('/brand/profile'),
        api.get('/brand/pillars'),
      ]);
      setProfile(profileRes.data.profile || {});
      setPillars(pillarsRes.data.pillars || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleSave = async () => {
    setSaving(true);
    setJustSaved(false);
    try {
      const payload = Object.fromEntries(FIELDS.map((f) => [f.key, profile[f.key] ?? null]));
      // api 联合类型（AxiosInstance | LocalDBAdapter）未声明 put，但 /brand/profile 后端仅注册 PUT
      const res = await (api as AxiosInstance).put('/brand/profile', payload);
      setProfile(res.data.profile);
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 2000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleAddPillar = async () => {
    const name = newPillar.trim();
    if (!name) return;
    try {
      await api.post('/brand/pillars', { name });
      setNewPillar('');
      const res = await api.get('/brand/pillars');
      setPillars(res.data.pillars || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeletePillar = async (id: string) => {
    try {
      await api.delete(`/brand/pillars/${id}`);
      setPillars((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="page-enter max-w-3xl">
      <div className="card p-6 mb-6">
        <div className="space-y-4">
          {FIELDS.map((field) => (
            <FormField key={field.key} label={field.label}>
              {field.textarea ? (
                <textarea
                  value={(profile[field.key] as string) || ''}
                  onChange={(e) => setProfile((prev) => ({ ...prev, [field.key]: e.target.value }))}
                  placeholder={field.placeholder}
                  rows={3}
                  className="input resize-none"
                />
              ) : (
                <input
                  type="text"
                  value={(profile[field.key] as string) || ''}
                  onChange={(e) => setProfile((prev) => ({ ...prev, [field.key]: e.target.value }))}
                  placeholder={field.placeholder}
                  className="input"
                />
              )}
            </FormField>
          ))}
        </div>
        <div className="flex justify-end mt-4">
          <button onClick={handleSave} disabled={saving} className="btn btn-primary text-sm">
            {justSaved ? (
              <>
                <Check size={14} /> 已保存
              </>
            ) : saving ? (
              '保存中...'
            ) : (
              '保存品牌资产'
            )}
          </button>
        </div>
      </div>

      <div className="card p-6">
        <h3 className="text-sm font-medium mb-1">内容支柱</h3>
        <p className="text-xs mb-4" style={{ color: 'var(--color-text-tertiary)' }}>
          3-5 个长期内容方向，选题时挂靠，保证输出不散
        </p>
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={newPillar}
            onChange={(e) => setNewPillar(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddPillar();
              }
            }}
            placeholder="如：人生管理系统"
            className="input flex-1"
          />
          <button onClick={handleAddPillar} disabled={!newPillar.trim()} className="btn btn-primary text-sm">
            <Plus size={14} /> 添加
          </button>
        </div>
        {pillars.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
            还没有内容支柱
          </p>
        ) : (
          <div className="space-y-2">
            {pillars.map((pillar) => (
              <div key={pillar.id} className="flex items-center justify-between px-3 py-2 rounded-lg" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
                <div>
                  <span className="text-sm">{pillar.name}</span>
                  {pillar.description && (
                    <span className="text-xs ml-2" style={{ color: 'var(--color-text-tertiary)' }}>
                      {pillar.description}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => handleDeletePillar(pillar.id)}
                  className="text-slate-400 hover:text-red-500 transition-colors"
                  aria-label={`删除支柱 ${pillar.name}`}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
