import React from 'react';
import { IonIcon } from '@ionic/react';
import { hardwareChipOutline } from 'ionicons/icons';

interface ChipHeaderProps {
  subtitle?: string;
}

const ChipHeader: React.FC<ChipHeaderProps> = ({ subtitle }) => (
  <div className="chip-header">
    <div className="chip-header__left">
      <IonIcon icon={hardwareChipOutline} className="chip-header__icon" />
      <span className="chip-header__brand">C.H.I.P</span>
    </div>
    {subtitle && <span className="chip-header__subtitle">{subtitle}</span>}
  </div>
);

export default ChipHeader;
