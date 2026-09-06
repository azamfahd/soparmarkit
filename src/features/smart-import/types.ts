export type SmartImportGroup = 'excel' | 'database' | 'ocr_ai' | 'cloud_sync';

export interface SmartImportHubProps {
  storeName: string;
  onImported?: () => void;
  onGoBack?: () => void;
  exportData?: () => void;
  importData?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleImportPython?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  isBackupOverdue?: boolean;
  lastBackupDate?: string | null;
  backupAlertInterval?: string;
  updateBackupAlertInterval?: (interval: string) => void;
  isBackupSyncing?: boolean;
  isAutoBackupEnabled?: boolean;
  setIsAutoBackupEnabled?: (val: boolean) => void;
  autoBackupFileStatus?: { exists: boolean; lastModified?: string; size?: number; path?: string } | string | null;
  forceLocalDiskBackup?: () => Promise<void>;
  resetDatabase?: () => void;
  showNotification?: (msg: string, type?: 'success' | 'error') => void;
  onOpenExcelSyncCenter?: () => void;
  formatPrice?: (price: number) => string;
  setActiveTab?: (tab: string) => void;
  deviceID?: string;
  isActivated?: boolean;
  trialDaysLeft?: number;
  activationDetails?: any;
  handleRequestCloudActivation?: (customDuration?: number, isRenewal?: boolean) => void;
  isSubmittingRequest?: boolean;
}
