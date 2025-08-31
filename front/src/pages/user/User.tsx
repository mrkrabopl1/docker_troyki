import React, { Suspense, useEffect, useState, useCallback, lazy, memo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getUserData, unlogin } from 'src/providers/userProvider'
import UserForm from 'src/modules/sendForm/UserForm'
import { useAppDispatch } from 'src/store/hooks/redux'
import { verified } from 'src/store/reducers/menuSlice'
import s from "./s.module.css"

const AddressForm = lazy(() => import('src/modules/sendForm/AddressForm'))

type UrlParamsType = {
  login: string
}

type UserValType = {
  name: string
  secondName: string
  mail: string
  address: string
  phone: string
}

const UserTabs = memo(({ 
  activeTab, 
  onTabChange, 
  onLogout 
}: {
  activeTab: number
  onTabChange: (tab: number) => void
  onLogout: () => void
}) => (
  <div className={s.tabs}>
    <div onClick={() => onTabChange(0)}>
      Инфо
    </div>
    <div onClick={() => onTabChange(1)}>
      Адрес
    </div>
    <div onClick={() => onTabChange(1)}>
      История покупок
    </div>
    <div onClick={onLogout}>
      Выход
    </div>
  </div>
))

const User: React.FC = () => {
  const { login } = useParams<UrlParamsType>()
  const dispatch = useAppDispatch()
  const navigate = useNavigate()

  const [tab, setTab] = useState(0)
  const [userVal, setUserVal] = useState<UserValType>({
    name: "",
    secondName: "",
    mail: "",
    address: "",
    phone: ""
  })

  // Загрузка данных пользователя с сохранением callback подхода
  useEffect(() => {
    getUserData((data) => {
      if (data) {
        setUserVal(prev => ({ ...prev, ...data }))
      } else {
        navigate("/main")
      }
    })
  }, [navigate])

  const handleTabChange = useCallback((tabIndex: number) => {
    setTab(tabIndex)
  }, [])

  const handleLogout = useCallback(() => {
    unlogin(() => {
      navigate("/")
      dispatch(verified(false))
    })
  }, [dispatch, navigate])

  const renderTabContent = useCallback(() => {
    switch (tab) {
      case 0:
        return <UserForm onChange={() => {}} />
      case 1:
        return (
          <Suspense fallback={<div>Загрузка...</div>}>
            <AddressForm valid={true} onChange={() => {}} />
          </Suspense>
        )
      default:
        return null
    }
  }, [tab])

  return (
    <div className={s.main}>
      <UserTabs 
        activeTab={tab} 
        onTabChange={handleTabChange} 
        onLogout={handleLogout} 
      />
      
      <div className={s.pages}>
        {renderTabContent()}
      </div>
    </div>
  )
}

export default memo(User)