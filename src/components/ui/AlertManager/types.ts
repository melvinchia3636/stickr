export interface AlertAction {
  text: string
  onPress?: () => void
  style?: 'cancel' | 'destructive'
}

export interface AlertConfig {
  title?: string
  message?: string
  icon?: string
  iconColor?: string
  actions?: AlertAction[]
}
