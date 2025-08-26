export interface IElectronAPI {
  loadPreferences: () => Promise<void>
  savePreferences: (preferences: any) => Promise<void>
}

declare global {
  interface Window {
    electron: IElectronAPI
    api: {
      ping: () => Promise<string>
    }
  }
}