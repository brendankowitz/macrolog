import React from 'react';
import { IonModal, IonContent, IonButton } from '@ionic/react';
import './HealthScoreInfoSheet.css';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const HealthScoreInfoSheet: React.FC<Props> = ({ isOpen, onClose }) => (
  <IonModal
    isOpen={isOpen}
    onDidDismiss={onClose}
    initialBreakpoint={0.55}
    breakpoints={[0, 0.55]}
    className="hsi-modal"
  >
    <IonContent className="hsi-content">
      <div className="hsi-handle" />
      <div className="hsi-body">
        <h2 className="hsi-title">What's my Health Score?</h2>
        <p className="hsi-subtitle">
          Your score (0–100) combines three things:
        </p>

        <div className="hsi-rows">
          <div className="hsi-row">
            <div className="hsi-icon-box hsi-icon-green">🥦</div>
            <div className="hsi-row-text">
              <span className="hsi-row-label">Nutrient Density <span className="hsi-pct">(33%)</span></span>
              <span className="hsi-row-desc">How rich in vitamins, minerals, and fiber this meal is.</span>
            </div>
          </div>

          <div className="hsi-row">
            <div className="hsi-icon-box hsi-icon-amber">🌾</div>
            <div className="hsi-row-text">
              <span className="hsi-row-label">Processing Level <span className="hsi-pct">(33%)</span></span>
              <span className="hsi-row-desc">Whole foods score high. Ultra-processed foods score low.</span>
            </div>
          </div>

          <div className="hsi-row">
            <div className="hsi-icon-box hsi-icon-blue">🎯</div>
            <div className="hsi-row-text">
              <span className="hsi-row-label">Goal Alignment <span className="hsi-pct">(34%)</span></span>
              <span className="hsi-row-desc">How well this meal fits your personal calorie and macro targets.</span>
            </div>
          </div>
        </div>

        <IonButton
          expand="block"
          fill="clear"
          className="hsi-done-btn"
          onClick={onClose}
        >
          Done
        </IonButton>
      </div>
    </IonContent>
  </IonModal>
);

export default HealthScoreInfoSheet;
