import { type TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux'
import type { rootStateType, appDispatchType } from '../sotre'

export const useappDispatchType = () => useDispatch<appDispatchType>()
export const useAppSelector: TypedUseSelectorHook<rootStateType> = useSelector