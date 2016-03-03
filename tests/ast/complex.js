export type User = {
  name: string,
  id: string,
  createdDate: number,
  title: ?string,
}

export type Props = {
  user: User,
  parent: ?User,
  getUser: (cb: (user: User) => void) => void,
  onClose: () => void,
  onUpdateCount: (user: User, count: number) => void,
}
