import React, { useState } from 'react';
import { IonModal, IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonIcon, IonButtons } from '@ionic/react';
import { closeOutline, checkmarkOutline, createOutline, trashOutline, leafOutline, checkmarkCircleOutline, thumbsUpOutline, warningOutline, trashBinOutline, informationCircleOutline } from 'ionicons/icons';
import { FoodItem } from '../types';
import { getHealthScoreColor, getHealthRating } from '../utils/helpers';
import HealthScoreInfoSheet from './HealthScoreInfoSheet';
import './MealReviewModal.css';

const healthIcon = (score: number) => {
  if (score >= 90) return leafOutline;
  if (score >= 70) return checkmarkCircleOutline;
  if (score >= 50) return thumbsUpOutline;
  return warningOutline;
};

interface Props {
  isOpen: boolean;
  foodItems: FoodItem[];
  imageUri: string;
  notes: string;
  onClose: () => void;
  onSave: (items: FoodItem[], notes: string) => Promise<void>;
  onDelete?: () => void;
}

/* Breakdown bar row */
const BreakdownRow: React.FC<{ label: string; score: number }> = ({ label, score }) => {
  const color = getHealthScoreColor(score);
  return (
    <div className="mr-breakdown-row">
      <span className="mr-breakdown-label">{label}</span>
      <div className="mr-breakdown-track">
        <div
          className="mr-breakdown-fill"
          style={{ width: `${score}%`, background: color }}
        />
      </div>
      <span className="mr-breakdown-num" style={{ color }}>{score}</span>
    </div>
  );
};

const MealReviewModal: React.FC<Props> = ({ isOpen, foodItems: init, imageUri, notes: initNotes, onClose, onSave, onDelete }) => {
  const [items, setItems] = useState<FoodItem[]>(init);
  const [notes, setNotes] = useState(initNotes);
  const [editId, setEditId] = useState<string | null>(null);
  const [showScoreInfo, setShowScoreInfo] = useState(false);

  const update = (id: string, field: keyof FoodItem, val: any) =>
    setItems(prev => prev.map(i => i.id === id ? { ...i, [field]: val } : i));

  const remove = (id: string) => {
    if (items.length === 1) { alert('Need at least one item'); return; }
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const totals = {
    cal:     items.reduce((s, i) => s + i.calories, 0),
    protein: items.reduce((s, i) => s + i.protein,  0),
    carbs:   items.reduce((s, i) => s + i.carbs,    0),
    fat:     items.reduce((s, i) => s + i.fat,      0),
  };

  const avgScore = Math.round(items.reduce((s, i) => s + i.healthScore, 0) / items.length);
  const scoreCol = getHealthScoreColor(avgScore);

  /* Aggregate breakdown across all items (simple average) */
  const avgBreakdown = {
    nutrientDensity: Math.round(items.reduce((s, i) => s + (i.healthBreakdown?.nutrientDensity ?? 0), 0) / items.length),
    processingLevel: Math.round(items.reduce((s, i) => s + (i.healthBreakdown?.processingLevel ?? 0), 0) / items.length),
    goalAlignment:   Math.round(items.reduce((s, i) => s + (i.healthBreakdown?.goalAlignment   ?? 0), 0) / items.length),
  };

  /* Use the first item's healthReason as the summary reason (most representative) */
  const summaryReason = items[0]?.healthReason ?? '';

  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(items, notes);
      onClose();
    } catch (e: any) {
      alert(e?.message || 'Failed to save meal');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <IonModal isOpen={isOpen} onDidDismiss={onClose} className="meal-review-modal">
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonButton fill="clear" onClick={onClose}>
                <IonIcon icon={closeOutline} style={{ fontSize: 22 }} />
              </IonButton>
            </IonButtons>
            <IonTitle>Review Meal</IonTitle>
            <IonButtons slot="end">
              {onDelete && (
                <IonButton fill="clear" onClick={() => {
                  if (window.confirm('Delete this meal entry?')) { onDelete(); onClose(); }
                }} style={{ color: 'var(--sys-red, #FF3B30)' }}>
                  <IonIcon icon={trashBinOutline} style={{ fontSize: 20 }} />
                </IonButton>
              )}
              <IonButton fill="clear" strong onClick={handleSave} disabled={saving} style={{ color: 'var(--sys-blue)' }}>
                {saving ? 'Saving…' : 'Save'}
              </IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>

        <IonContent fullscreen>
          <div className="mr-container">

            {/* Image */}
            <img src={imageUri} alt="Meal" className="mr-image" />

            {/* Summary */}
            <div className="mr-summary">
              {/* Top row: calories + score */}
              <div className="mr-summary-row">
                <div>
                  <div className="mr-cal-num">{Math.round(totals.cal)}</div>
                  <div className="mr-cal-lbl">calories total</div>
                </div>
                <button className="mr-score-box" onClick={() => setShowScoreInfo(true)}>
                  <div className="mr-score-val" style={{ color: scoreCol }}>{avgScore}</div>
                  <div className="mr-score-rating" style={{ color: scoreCol }}>
                    {getHealthRating(avgScore)}
                    <IonIcon icon={informationCircleOutline} className="mr-score-info-icon" />
                  </div>
                </button>
              </div>

              {/* Health breakdown */}
              <div className="mr-breakdown">
                <BreakdownRow label="Nutrient Density" score={avgBreakdown.nutrientDensity} />
                <BreakdownRow label="Processing Level" score={avgBreakdown.processingLevel} />
                <BreakdownRow label="Goal Alignment"   score={avgBreakdown.goalAlignment} />
                {summaryReason ? (
                  <p className="mr-health-reason">{summaryReason}</p>
                ) : null}
              </div>

              {/* Macros */}
              <div className="mr-macros">
                <div className="mr-macro">
                  <div className="mr-macro-val" style={{ color: 'var(--protein-color)' }}>{Math.round(totals.protein)}g</div>
                  <div className="mr-macro-lbl">Protein</div>
                </div>
                <div className="mr-macro">
                  <div className="mr-macro-val" style={{ color: 'var(--carbs-color)' }}>{Math.round(totals.carbs)}g</div>
                  <div className="mr-macro-lbl">Carbs</div>
                </div>
                <div className="mr-macro">
                  <div className="mr-macro-val" style={{ color: 'var(--fat-color)' }}>{Math.round(totals.fat)}g</div>
                  <div className="mr-macro-lbl">Fat</div>
                </div>
              </div>
            </div>

            {/* Notes */}
            <span className="mr-section-title">Notes</span>
            <textarea
              className="mr-notes"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Add a note about this meal…"
              rows={3}
            />

            {/* Food items */}
            <span className="mr-section-title">{items.length} Item{items.length !== 1 ? 's' : ''}</span>
            <div className="mr-food-list">
              {items.map(item => {
                const editing = editId === item.id;
                const col = getHealthScoreColor(item.healthScore);

                return (
                  <div key={item.id} className="mr-food-row">
                    <div className="mr-food-top">
                      <div className="mr-food-left">
                        {editing ? (
                          <input
                            className="mr-food-name-input"
                            value={item.name}
                            onChange={e => update(item.id, 'name', e.target.value)}
                          />
                        ) : (
                          <>
                            <div className="mr-food-name">{item.name}</div>
                            <span className="mr-food-badge" style={{ background: `${col}18`, color: col }}>
                              <IonIcon icon={healthIcon(item.healthScore)} style={{ fontSize: 11 }} />
                              {item.healthScore}
                            </span>
                            {item.encouragement && (
                              <div className="mr-encouragement">{item.encouragement}</div>
                            )}
                            {item.healthBreakdown && (
                              <div className="mr-item-breakdown">
                                🥦 {item.healthBreakdown.nutrientDensity} · 🌾 {item.healthBreakdown.processingLevel} · 🎯 {item.healthBreakdown.goalAlignment}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                      <div className="mr-food-actions">
                        <button className="mr-action-btn" onClick={() => setEditId(editing ? null : item.id)}>
                          <IonIcon icon={editing ? checkmarkOutline : createOutline} style={{ fontSize: 15 }} />
                        </button>
                        <button className="mr-action-btn danger" onClick={() => remove(item.id)}>
                          <IonIcon icon={trashOutline} style={{ fontSize: 15 }} />
                        </button>
                      </div>
                    </div>

                    <div className="mr-nutrition">
                      {([['calories', 'cal'], ['protein', 'prot'], ['carbs', 'carb'], ['fat', 'fat']] as const).map(([field, lbl]) => (
                        <div key={field} className="mr-nut-cell">
                          {editing ? (
                            <input
                              className="mr-nut-input"
                              type="number"
                              value={item[field] as number}
                              onChange={e => update(item.id, field, parseInt(e.target.value) || 0)}
                            />
                          ) : (
                            <div className="mr-nut-val">{item[field]}</div>
                          )}
                          <div className="mr-nut-lbl">{lbl}</div>
                        </div>
                      ))}
                    </div>

                    {editing && (
                      <div className="mr-amount-row">
                        <input
                          className="mr-amt-input"
                          type="number"
                          value={item.amount}
                          onChange={e => update(item.id, 'amount', parseFloat(e.target.value) || 0)}
                          placeholder="Amount"
                        />
                        <input
                          className="mr-amt-input"
                          value={item.unit}
                          onChange={e => update(item.id, 'unit', e.target.value)}
                          placeholder="Unit"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <button className="mr-save-btn" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : 'Save Meal'}
            </button>

          </div>
        </IonContent>
      </IonModal>

      <HealthScoreInfoSheet isOpen={showScoreInfo} onClose={() => setShowScoreInfo(false)} />
    </>
  );
};

export default MealReviewModal;
