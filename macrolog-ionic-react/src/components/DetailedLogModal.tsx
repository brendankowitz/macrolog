import React, { useState } from 'react';
import { IonModal, IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonIcon, IonButtons, IonSpinner } from '@ionic/react';
import { closeOutline, addOutline, closeCircle, sparklesOutline } from 'ionicons/icons';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import './DetailedLogModal.css';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onAnalyze: (base64Images: string[], notes: string) => Promise<void>;
}

const MAX_PHOTOS = 5;

const DetailedLogModal: React.FC<Props> = ({ isOpen, onClose, onAnalyze }) => {
  const [photos, setPhotos] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);

  const addPhoto = async () => {
    try {
      const photo = await Camera.getPhoto({
        quality: 70,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Prompt,
        width: 800,
      });
      if (photo.base64String) {
        setPhotos(prev => [...prev, photo.base64String!]);
      }
    } catch (e: any) {
      if (!e.message?.includes('cancelled')) console.error(e);
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleAnalyze = async () => {
    if (photos.length === 0) return;
    setBusy(true);
    try {
      await onAnalyze(photos, notes);
      // reset for next time
      setPhotos([]);
      setNotes('');
    } finally {
      setBusy(false);
    }
  };

  const handleClose = () => {
    if (busy) return;
    setPhotos([]);
    setNotes('');
    onClose();
  };

  return (
    <IonModal isOpen={isOpen} onDidDismiss={handleClose} className="dl-modal">
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonButton fill="clear" onClick={handleClose} disabled={busy}>
              <IonIcon icon={closeOutline} style={{ fontSize: 22 }} />
            </IonButton>
          </IonButtons>
          <IonTitle>Detailed Log</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen>
        <div className="dl-body">

          {/* Photos */}
          <div className="dl-section-title">Photos ({photos.length}/{MAX_PHOTOS})</div>
          <div className="dl-photo-grid">
            {photos.map((b64, i) => (
              <div key={i} className="dl-photo-cell">
                <img src={`data:image/jpeg;base64,${b64}`} alt="" className="dl-photo-img" />
                <button className="dl-photo-remove" onClick={() => removePhoto(i)}>
                  <IonIcon icon={closeCircle} style={{ fontSize: 16 }} />
                </button>
              </div>
            ))}
            {photos.length < MAX_PHOTOS && (
              <button className="dl-add-btn" onClick={addPhoto} disabled={busy}>
                <IonIcon icon={addOutline} className="dl-add-icon" />
                Add Photo
              </button>
            )}
          </div>

          {/* Notes */}
          <div className="dl-section-title">Context Notes</div>
          <textarea
            className="dl-notes"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Describe your meal, e.g. I'm making a protein smoothie with banana, oats, and peanut butter..."
            rows={4}
            disabled={busy}
          />

          {/* Analyze */}
          <button
            className="dl-analyze-btn"
            onClick={handleAnalyze}
            disabled={busy || photos.length === 0}
          >
            {busy
              ? <><IonSpinner name="crescent" style={{ width: 18, height: 18 }} /> Analyzing…</>
              : <><IonIcon icon={sparklesOutline} style={{ fontSize: 18 }} /> Analyze Meal</>
            }
          </button>

          <div className="dl-hint">
            {photos.length === 0
              ? 'Add at least one photo to continue'
              : `${photos.length} photo${photos.length > 1 ? 's' : ''} ready${notes.trim() ? ' · Notes included' : ''}`
            }
          </div>

        </div>
      </IonContent>
    </IonModal>
  );
};

export default DetailedLogModal;
