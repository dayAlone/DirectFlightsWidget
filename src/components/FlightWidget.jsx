import React, { useState, useRef, useEffect, useMemo } from 'react'
import './FlightWidget.css'

const routes = [
  { id: 'MOW-LED', name: 'Москва — Санкт-Петербург', origin: 'MOW', destination: 'LED', airlines: ['SU', 'DP', 'S7', 'N4', 'R0', 'FV'] },
  { id: 'MOW-AER', name: 'Москва — Сочи', origin: 'MOW', destination: 'AER', airlines: ['SU', 'FV', 'DP', 'S7', 'UT', 'Y7'] },
  { id: 'MOW-OVB', name: 'Москва — Новосибирск', origin: 'MOW', destination: 'OVB', airlines: ['SU', 'S7', 'DP', '5N'] },
  { id: 'MOW-DXB', name: 'Москва — Дубай', origin: 'MOW', destination: 'DXB', airlines: ['SU', 'EK', 'FZ', 'DP', 'UT'] },
  { id: 'MOW-TAS', name: 'Москва — Ташкент', origin: 'MOW', destination: 'TAS', airlines: ['SU', 'HY', 'DP', 'HH', 'U6'] },
  { id: 'MOW-BJS', name: 'Москва — Пекин', origin: 'MOW', destination: 'BJS', airlines: ['SU', 'CA', 'CZ', 'MU'] },
  { id: 'LED-AER', name: 'Санкт-Петербург — Сочи', origin: 'LED', destination: 'AER', airlines: ['SU', 'FV', 'N4', '5N'] },
  { id: 'LED-OVB', name: 'Санкт-Петербург — Новосибирск', origin: 'LED', destination: 'OVB', airlines: ['SU', 'S7', '5N'] },
  { id: 'LED-DXB', name: 'Санкт-Петербург — Дубай', origin: 'LED', destination: 'DXB', airlines: ['SU', 'EK', 'FZ'] },
  { id: 'SVX-OVB', name: 'Екатеринбург — Новосибирск', origin: 'SVX', destination: 'OVB', airlines: ['S7'] },
  { id: 'OVB-KJA', name: 'Новосибирск — Красноярск', origin: 'OVB', destination: 'KJA', airlines: ['S7'] },
  { id: 'CEK-AYT', name: 'Челябинск — Анталья', origin: 'CEK', destination: 'AYT', airlines: ['2S', 'U6'] },
  { id: 'HKT-BKK', name: 'Пхукет — Бангкок', origin: 'HKT', destination: 'BKK', airlines: ['DD', 'FD', 'TG'] },
  { id: 'BCN-PAR', name: 'Барселона — Париж', origin: 'BCN', destination: 'PAR', airlines: ['AF', 'FR', 'TO', 'VY'] },
  { id: 'BEG-BCN', name: 'Белград — Барселона', origin: 'BEG', destination: 'BCN', airlines: ['JU', 'W6'] }
]

const airlines = {
  'SU': { name: 'Аэрофлот', code: 'SU' },
  'DP': { name: 'Победа', code: 'DP' },
  'S7': { name: 'S7 Airlines', code: 'S7' },
  'N4': { name: 'Nordwind', code: 'N4' },
  'R0': { name: 'Сапсан', code: 'R0' },
  'FV': { name: 'Россия', code: 'FV' },
  '5N': { name: 'Smartavia', code: '5N' },
  'UT': { name: 'ЮТэйр', code: 'UT' },
  'Y7': { name: 'NordStar', code: 'Y7' },
  'EK': { name: 'Emirates', code: 'EK' },
  'FZ': { name: 'flydubai', code: 'FZ' },
  'HY': { name: 'Uzbekistan Airways', code: 'HY' },
  'HH': { name: 'Qanot Sharq', code: 'HH' },
  'U6': { name: 'Уральские авиалинии', code: 'U6' },
  'CA': { name: 'Air China', code: 'CA' },
  'CZ': { name: 'China Southern', code: 'CZ' },
  'MU': { name: 'China Eastern', code: 'MU' },
  '2S': { name: 'Smartavia', code: '2S' },
  'DD': { name: 'Nok Air', code: 'DD' },
  'FD': { name: 'Thai AirAsia', code: 'FD' },
  'TG': { name: 'Thai Airways', code: 'TG' },
  'AF': { name: 'Air France', code: 'AF' },
  'FR': { name: 'Ryanair', code: 'FR' },
  'TO': { name: 'Transavia France', code: 'TO' },
  'VY': { name: 'Vueling', code: 'VY' },
  'JU': { name: 'Air Serbia', code: 'JU' },
  'W6': { name: 'Wizz Air', code: 'W6' }
}

// Парсинг CSV данных
const parseCSVData = (csvText) => {
  const lines = csvText.trim().split('\n')
  const flights = []
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue
    
    const [origin, destination, airline, departureTs, price] = line.split(',')
    flights.push({
      origin: origin,
      destination: destination,
      airline: airline,
      departureTs: departureTs,
      price: parseInt(price)
    })
  }
  return flights
}

// Загрузка и обработка данных из CSV
const loadFlightData = async (route, airlineCode, searchDepth = 0) => {
  try {
    // Преобразуем формат route из "MOW-LED" в "MOW_LED"
    const routeFormatted = route.replace('-', '_')
    const csvUrl = `./src/data/${routeFormatted}_${airlineCode}_${searchDepth}.csv`
    const response = await fetch(csvUrl)
    const csvText = await response.text()
    const flights = parseCSVData(csvText)
    
    // Группируем рейсы по датам
    const dateMap = new Map()
    
    flights.forEach(flight => {
      const date = new Date(flight.departureTs)
      const dateKey = date.toISOString().split('T')[0] // YYYY-MM-DD
      
      if (!dateMap.has(dateKey)) {
        dateMap.set(dateKey, [])
      }
      
      const time = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
      dateMap.get(dateKey).push({
        time,
        price: flight.price,
        fullDate: date
      })
    })
    
    // Возвращаем Map с данными по датам
    return dateMap
  } catch (error) {
    console.error('Error loading flight data:', error)
    return new Map()
  }
}

// Генерация массива дат на основе базовой даты, глубины поиска и количества дат
const generateDatesArray = (dateMap, searchDepth, visibleDatesCount) => {
  const dates = []
  // Базовая дата: 30.10.2025
  const baseDate = new Date('2025-10-30')
  
  // Добавляем глубину поиска к базовой дате
  const startDate = new Date(baseDate)
  startDate.setDate(startDate.getDate() + searchDepth)
  
  // Генерируем массив дат
  for (let i = 0; i < visibleDatesCount; i++) {
    const currentDate = new Date(startDate)
    currentDate.setDate(startDate.getDate() + i)
    
    const dateKey = currentDate.toISOString().split('T')[0]
    const flightsForDate = dateMap.get(dateKey) || []
    
    // Сортируем рейсы по времени
    flightsForDate.sort((a, b) => a.time.localeCompare(b.time))
    
    // Находим минимальную цену
    const minPrice = flightsForDate.length > 0 ? Math.min(...flightsForDate.map(f => f.price)) : null
    
    dates.push({
      id: i,
      day: currentDate.getDate(),
      weekday: currentDate.toLocaleDateString('ru-RU', { weekday: 'short' }).replace('.', '').toLowerCase(),
      month: currentDate.toLocaleDateString('ru-RU', { month: 'short' }).replace('.', '').slice(0, 3),
      fullDate: currentDate,
      flights: flightsForDate,
      hasFlights: flightsForDate.length > 0,
      minPrice: minPrice
    })
  }
  
  return dates
}

// Форматирование цены
const formatPrice = (price) => {
  if (!price) return ''
  const formatted = price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
  return `${formatted}\u202F₽`
}

// Генерация деталей рейса
const generateFlightDetails = (time, airlineCode) => {
  const [hours, minutes] = time.split(':').map(Number)
  const departureMinutes = hours * 60 + minutes
  const flightDuration = 95 // 1ч 35м
  const arrivalMinutes = departureMinutes + flightDuration
  const arrivalHours = Math.floor(arrivalMinutes / 60) % 24
  const arrivalMins = arrivalMinutes % 60
  
  return {
    departureTime: time,
    arrivalTime: `${arrivalHours.toString().padStart(2, '0')}:${arrivalMins.toString().padStart(2, '0')}`,
    airline: airlines[airlineCode]?.name || airlineCode,
    airlineCode: airlineCode
  }
}

function FlightWidget({ 
  initialDate = 0,
  onDateSelect = () => {},
  onTimeSelect = () => {},
  className = ''
}) {
  // Чтение параметров из URL
  const getUrlParams = () => {
    const params = new URLSearchParams(window.location.search)
    return {
      route: params.get('route') || routes[0].id,
      airline: params.get('airline') || 'SU',
      depth: parseInt(params.get('depth') || '0'),
      priceMode: params.get('priceMode') || 'cheapest',
      priceDisplay: params.get('priceDisplay') || 'difference',
      collapse: params.get('collapse') === 'true',
      collapseOnClick: params.get('collapseOnClick') !== 'false',
      priceIndicator: params.get('priceIndicator') !== 'false',
      datesCount: parseInt(params.get('datesCount') || '3'),
      initialDay: params.get('initialDay') || 'first',
      date: params.get('date') ? parseInt(params.get('date')) : initialDate,
      time: params.get('time') || null,
      controls: params.get('controls') !== 'false'
    }
  }

  const urlParams = getUrlParams()

  const [selectedRoute, setSelectedRoute] = useState(urlParams.route)
  const [selectedAirline, setSelectedAirline] = useState(urlParams.airline)
  const [searchDepth, setSearchDepth] = useState(urlParams.depth)
  
  // Получаем доступные авиакомпании для текущего маршрута
  const currentRoute = useMemo(() => routes.find(r => r.id === selectedRoute), [selectedRoute])
  const availableAirlines = useMemo(() => currentRoute?.airlines || [], [currentRoute])
  
  // При изменении маршрута проверяем, доступна ли текущая авиакомпания
  useEffect(() => {
    if (!availableAirlines.includes(selectedAirline)) {
      // Если выбранная авиакомпания недоступна для нового маршрута, выбираем первую доступную
      setSelectedAirline(availableAirlines[0] || 'SU')
    }
  }, [selectedRoute, availableAirlines, selectedAirline])
  const [dates, setDates] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(urlParams.date)
  const [selectedTime, setSelectedTime] = useState(urlParams.time)
  const [flightDetails, setFlightDetails] = useState(null)
  const [priceMode, setPriceMode] = useState(urlParams.priceMode)
  const [isTimeComparisonActive, setIsTimeComparisonActive] = useState(false)
  const [priceDisplayMode, setPriceDisplayMode] = useState(urlParams.priceDisplay)
  const [collapseEnabled, setCollapseEnabled] = useState(urlParams.collapse)
  const [isDatesExpanded, setIsDatesExpanded] = useState(!urlParams.collapse)
  const [collapseOnClick, setCollapseOnClick] = useState(urlParams.collapseOnClick)
  const [showPriceIndicator, setShowPriceIndicator] = useState(urlParams.priceIndicator)
  const [visibleDatesCount, setVisibleDatesCount] = useState(urlParams.datesCount)
  const [initialDayMode, setInitialDayMode] = useState(urlParams.initialDay)
  const [showControls, setShowControls] = useState(urlParams.controls)
  const [canScrollDatesLeft, setCanScrollDatesLeft] = useState(false)
  const [canScrollDatesRight, setCanScrollDatesRight] = useState(false)
  const [canScrollTimesLeft, setCanScrollTimesLeft] = useState(false)
  const [canScrollTimesRight, setCanScrollTimesRight] = useState(false)
  
  const dateRefs = useRef([])
  const timeRefs = useRef({})
  const datesScrollRef = useRef(null)
  const timesScrollRef = useRef(null)
  const expandCollapseTimer = useRef(null)
  const lastMousePosition = useRef({ x: 0, y: 0 })
  const hasMovedAfterClick = useRef(false)

  // Обновление URL при изменении параметров
  useEffect(() => {
    const params = new URLSearchParams()
    
    // Добавляем параметры только если они отличаются от значений по умолчанию
    if (selectedRoute !== routes[0].id) params.set('route', selectedRoute)
    if (selectedAirline !== 'SU') params.set('airline', selectedAirline)
    if (searchDepth !== 0) params.set('depth', searchDepth.toString())
    if (priceMode !== 'cheapest') params.set('priceMode', priceMode)
    if (priceDisplayMode !== 'difference') params.set('priceDisplay', priceDisplayMode)
    if (collapseEnabled) params.set('collapse', 'true')
    if (!collapseOnClick) params.set('collapseOnClick', 'false')
    if (!showPriceIndicator) params.set('priceIndicator', 'false')
    if (visibleDatesCount !== 3) params.set('datesCount', visibleDatesCount.toString())
    if (initialDayMode !== 'first') params.set('initialDay', initialDayMode)
    if (!showControls) params.set('controls', 'false')
    if (selectedDate !== null && selectedDate !== initialDate) params.set('date', selectedDate.toString())
    if (selectedTime) params.set('time', selectedTime)
    
    const newUrl = params.toString() 
      ? `${window.location.pathname}?${params.toString()}`
      : window.location.pathname
    window.history.replaceState({}, '', newUrl)
  }, [
    selectedRoute,
    selectedAirline,
    searchDepth,
    priceMode,
    priceDisplayMode,
    collapseEnabled,
    collapseOnClick,
    showPriceIndicator,
    visibleDatesCount,
    initialDayMode,
    showControls,
    selectedDate,
    selectedTime
  ])
  
  // Сброс даты и времени при изменении направления, авиакомпании или глубины
  useEffect(() => {
    setSelectedDate(initialDate)
    setSelectedTime(null)
  }, [selectedRoute, selectedAirline, searchDepth])
  
  // Загрузка данных из CSV
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      setSelectedTime(null)
      setFlightDetails(null)
      setIsTimeComparisonActive(false) // Сбрасываем флаг при загрузке новых данных
      const dateMap = await loadFlightData(selectedRoute, selectedAirline, searchDepth)
      const datesArray = generateDatesArray(dateMap, searchDepth, visibleDatesCount)
      setDates(datesArray)
      
      // Выбираем начальный день в зависимости от настройки
      if (initialDayMode === 'cheapest' && datesArray.length > 0) {
        // Ищем день с самым дешевым рейсом среди всех дат
        let cheapestDayIndex = 0
        let cheapestPrice = Infinity
        
        datesArray.forEach((date, index) => {
          if (date.hasFlights && date.minPrice < cheapestPrice) {
            cheapestPrice = date.minPrice
            cheapestDayIndex = index
          }
        })
        
        setSelectedDate(cheapestDayIndex)
      } else {
        // Выбираем первый день с доступными рейсами
        const firstAvailableIndex = datesArray.findIndex(date => date.hasFlights)
        setSelectedDate(firstAvailableIndex !== -1 ? firstAvailableIndex : initialDate)
      }
      
      setIsLoading(false)
    }
    loadData()
  }, [selectedRoute, selectedAirline, searchDepth, initialDayMode, initialDate, visibleDatesCount])
  
  // Получаем цену выбранного рейса
  const selectedPrice = useMemo(() => {
    if (!selectedTime || !dates[selectedDate]) return null
    const selectedFlight = dates[selectedDate].flights.find(f => f.time === selectedTime)
    return selectedFlight ? selectedFlight.price : null
  }, [selectedTime, selectedDate, dates])

  // Форматирование цены с учетом режима отображения
  const formatPriceDisplay = (price, time = null) => {
    if (!price) return ''
    
    if (time && time === selectedTime) {
      return formatPrice(price)
    }
    
    if (priceDisplayMode === 'difference' && selectedPrice != null) {
      const diff = price - selectedPrice
      if (diff === 0) return 'та же цена'
      const sign = diff > 0 ? '+' : '−'
      const formatted = Math.abs(diff).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
      return `${sign}${formatted}\u202F₽`
    }
    
    return formatPrice(price)
  }

  // Определение тона цены
  const getPriceTone = (price) => {
    if (!price || !selectedPrice) return ''
    if (price < selectedPrice) return 'price-cheaper'
    if (price > selectedPrice) return 'price-higher'
    return 'price-equal'
  }

  useEffect(() => {
    // Инициализация: выбираем самый дешевый рейс при первой загрузке
    if (dates[initialDate] && dates[initialDate].flights.length > 0) {
      const cheapestFlight = dates[initialDate].flights.reduce((min, flight) => 
        flight.price < min.price ? flight : min
      )
      setSelectedTime(cheapestFlight.time)
      setFlightDetails(generateFlightDetails(cheapestFlight.time, selectedAirline))
    }
  }, [dates, initialDate])

  useEffect(() => {
    // Автоматически выбираем самый дешевый рейс при смене даты
    // НО: если активен режим сравнения по времени, не переключаемся автоматически
    // (выбор по времени происходит в handleDateClick)
    if (isTimeComparisonActive && (priceMode === 'by-time' || priceMode === 'by-time-nearby')) {
      return
    }
    
    if (dates[selectedDate] && dates[selectedDate].flights.length > 0) {
      const cheapestFlight = dates[selectedDate].flights.reduce((min, flight) => 
        flight.price < min.price ? flight : min
      )
      setSelectedTime(cheapestFlight.time)
      setFlightDetails(generateFlightDetails(cheapestFlight.time, selectedAirline))
    }
  }, [selectedDate, dates, isTimeComparisonActive, priceMode])

  useEffect(() => {
    const el = dateRefs.current[selectedDate]
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
    }
  }, [selectedDate])

  useEffect(() => {
    const el = timeRefs.current[selectedTime]
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
    }
  }, [selectedTime])

  // Очистка таймера при размонтировании компонента
  useEffect(() => {
    return () => {
      if (expandCollapseTimer.current) {
        clearTimeout(expandCollapseTimer.current)
      }
    }
  }, [])

  // Обработчики для задержки сворачивания/разворачивания
  const handleDatesMouseEnter = (e) => {
    if (!collapseEnabled) return
    
    // Сохраняем начальную позицию мыши
    lastMousePosition.current = { x: e.clientX, y: e.clientY }
    hasMovedAfterClick.current = false
    
    // Очищаем предыдущий таймер, если он есть
    if (expandCollapseTimer.current) {
      clearTimeout(expandCollapseTimer.current)
    }
    
    // Устанавливаем задержку перед разворачиванием
    expandCollapseTimer.current = setTimeout(() => {
      setIsDatesExpanded(true)
      hasMovedAfterClick.current = true
    }, 250)
  }

  const handleDatesMouseMove = (e) => {
    if (!collapseEnabled || isDatesExpanded) return
    
    // Проверяем, двинулась ли мышь достаточно (более 5 пикселей)
    const deltaX = Math.abs(e.clientX - lastMousePosition.current.x)
    const deltaY = Math.abs(e.clientY - lastMousePosition.current.y)
    
    if ((deltaX > 5 || deltaY > 5) && !hasMovedAfterClick.current) {
      hasMovedAfterClick.current = true
      
      // Обновляем позицию мыши
      lastMousePosition.current = { x: e.clientX, y: e.clientY }
      
      // Очищаем предыдущий таймер
      if (expandCollapseTimer.current) {
        clearTimeout(expandCollapseTimer.current)
      }
      
      // Устанавливаем задержку перед разворачиванием
      expandCollapseTimer.current = setTimeout(() => {
        setIsDatesExpanded(true)
      }, 250)
    }
  }

  const handleDatesMouseLeave = () => {
    if (!collapseEnabled) return
    
    // Сбрасываем флаг движения
    hasMovedAfterClick.current = false
    
    // Очищаем предыдущий таймер, если он есть
    if (expandCollapseTimer.current) {
      clearTimeout(expandCollapseTimer.current)
    }
    
    // Устанавливаем задержку перед сворачиванием
    expandCollapseTimer.current = setTimeout(() => {
      setIsDatesExpanded(false)
    }, 250)
  }

  const handleDateClick = (dateId) => {
    // Очищаем таймер задержки, так как действие происходит сразу
    if (expandCollapseTimer.current) {
      clearTimeout(expandCollapseTimer.current)
    }
    
    // Сбрасываем флаг движения после клика
    hasMovedAfterClick.current = false
    
    setSelectedDate(dateId)
    onDateSelect(dateId)
    if (collapseEnabled && collapseOnClick) {
      setIsDatesExpanded(false) // Сворачиваем блок дат при клике, если включено сворачивание и сворачивание при клике
    }
    
    // Во втором и третьем режимах, когда сравнение по времени активно, ищем рейс по времени
    if ((priceMode === 'by-time' || priceMode === 'by-time-nearby') && isTimeComparisonActive && selectedTime && dates[dateId]) {
      const date = dates[dateId]
      
      if (date.flights.length > 0) {
        // Сначала ищем точное совпадение по времени
        const exactMatch = date.flights.find(f => f.time === selectedTime)
        if (exactMatch) {
          setSelectedTime(exactMatch.time)
          setFlightDetails(generateFlightDetails(exactMatch.time, selectedAirline))
          return
        }
        
        // Если точного совпадения нет и режим "by-time-nearby", ищем ближайший рейс
        if (priceMode === 'by-time-nearby') {
          const nearbyFlight = findNearbyFlight(date.flights, selectedTime)
          if (nearbyFlight) {
            setSelectedTime(nearbyFlight.time)
            setFlightDetails(generateFlightDetails(nearbyFlight.time, selectedAirline))
            return
          }
        }
        
        // Если не нашли совпадение (или ближайший в третьем режиме), выбираем самый дешевый
        const cheapestFlight = date.flights.reduce((min, flight) => 
          flight.price < min.price ? flight : min
        )
        setSelectedTime(cheapestFlight.time)
        setFlightDetails(generateFlightDetails(cheapestFlight.time, selectedAirline))
      }
    }
  }

  const handleTimeClick = (time) => {
    setSelectedTime(time)
    setFlightDetails(generateFlightDetails(time, selectedAirline))
    onTimeSelect(time)
    
    // В режимах "by-time" и "by-time-nearby" активируем сравнение по времени, если выбрано не самое дешевое время
    if ((priceMode === 'by-time' || priceMode === 'by-time-nearby') && !isTimeComparisonActive) {
      const currentDateFlights = dates[selectedDate].flights
      if (currentDateFlights.length > 0) {
        const cheapestFlight = currentDateFlights.reduce((min, flight) => 
          flight.price < min.price ? flight : min
        )
        
        // Если выбрали не самое дешевое время, активируем режим сравнения по времени
        if (time !== cheapestFlight.time) {
          setIsTimeComparisonActive(true)
        }
      }
    }
  }
  
  // Проверяем, является ли выбранное время самым дешевым
  const isSelectedTimeCheapest = useMemo(() => {
    if (!selectedTime || !dates[selectedDate]) return true
    const currentDateFlights = dates[selectedDate].flights
    if (currentDateFlights.length === 0) return true
    
    const cheapestFlight = currentDateFlights.reduce((min, flight) => 
      flight.price < min.price ? flight : min
    )
    
    return selectedTime === cheapestFlight.time
  }, [selectedTime, selectedDate, dates])
  
  // Функция для поиска ближайшего рейса в промежутке ±1 час
  const findNearbyFlight = (flights, targetTime) => {
    if (!targetTime || flights.length === 0) return null
    
    // Парсим целевое время
    const [targetHours, targetMinutes] = targetTime.split(':').map(Number)
    const targetMinutesTotal = targetHours * 60 + targetMinutes
    
    // Фильтруем рейсы в промежутке ±60 минут
    const nearbyFlights = flights.filter(flight => {
      const [hours, minutes] = flight.time.split(':').map(Number)
      const flightMinutesTotal = hours * 60 + minutes
      const diff = Math.abs(flightMinutesTotal - targetMinutesTotal)
      return diff <= 60 // ±1 час
    })
    
    // Находим самый дешевый из ближайших
    if (nearbyFlights.length === 0) return null
    return nearbyFlights.reduce((min, flight) => 
      flight.price < min.price ? flight : min
    )
  }

  // Функция для получения информации о цене для даты
  const getDatePriceInfo = (date) => {
    // Определяем, нужна ли приставка "от" (не нужна в режиме отображения разницы)
    const showLabel = priceDisplayMode === 'absolute' ? 'от' : null
    
    // Режим "cheapest" - всегда показывает минимальную цену
    if (priceMode === 'cheapest') {
      return {
        price: date.minPrice,
        label: showLabel,
        hasFlights: date.hasFlights
      }
    }
    
    // Режим "by-time"
    if (priceMode === 'by-time') {
      // Если сравнение по времени активировано, всегда ищем рейс с таким же временем
      if (isTimeComparisonActive && selectedTime) {
        const flightAtTime = date.flights.find(f => f.time === selectedTime)
        if (flightAtTime) {
          return {
            price: flightAtTime.price,
            label: null,
            hasFlights: true,
            selectedFlight: flightAtTime
          }
        }
        
        return {
          price: null,
          label: null,
          hasFlights: false
        }
      }
      
      // Если сравнение по времени еще не активировано, показываем минимальную цену
      return {
        price: date.minPrice,
        label: showLabel,
        hasFlights: date.hasFlights
      }
    }
    
    // Режим "by-time-nearby" - ищем точное совпадение или ближайший рейс
    if (priceMode === 'by-time-nearby') {
      // Если сравнение по времени активировано
      if (isTimeComparisonActive && selectedTime) {
        // Сначала ищем точное совпадение
        const exactMatch = date.flights.find(f => f.time === selectedTime)
        if (exactMatch) {
          return {
            price: exactMatch.price,
            label: null,
            hasFlights: true,
            selectedFlight: exactMatch
          }
        }
        
        // Если точного совпадения нет, ищем ближайший
        const nearbyFlight = findNearbyFlight(date.flights, selectedTime)
        if (nearbyFlight) {
          return {
            price: nearbyFlight.price,
            label: null,
            hasFlights: true,
            selectedFlight: nearbyFlight
          }
        }
        
        return {
          price: null,
          label: null,
          hasFlights: false
        }
      }
      
      // Если сравнение по времени еще не активировано, показываем минимальную цену
      return {
        price: date.minPrice,
        label: showLabel,
        hasFlights: date.hasFlights
      }
    }
    
    // Fallback
    return {
      price: date.minPrice,
      label: showLabel,
      hasFlights: date.hasFlights
    }
  }

  const checkScroll = (element, setLeft, setRight) => {
    if (!element) return
    const { scrollWidth, clientWidth } = element
    const hasScrollableContent = scrollWidth > clientWidth
    
    if (!hasScrollableContent) {
      setLeft(false)
      setRight(false)
      return
    }

    const scrollLeft = element.scrollLeft
    const maxScroll = scrollWidth - clientWidth
    
    setLeft(scrollLeft > 1)
    setRight(scrollLeft < maxScroll - 1)
  }

  const handleScroll = (ref, direction, itemCount = 3) => {
    if (!ref.current) return
    
    const container = ref.current
    const firstItem = container.children[0]
    if (!firstItem) return
    
    const itemWidth = firstItem.offsetWidth
    const gap = parseInt(window.getComputedStyle(container).gap) || 0
    const scrollAmount = (itemWidth + gap) * itemCount
    
    if (direction === 'left') {
      container.scrollBy({ left: -scrollAmount, behavior: 'smooth' })
    } else {
      container.scrollBy({ left: scrollAmount, behavior: 'smooth' })
    }
  }

  useEffect(() => {
    const datesScroll = datesScrollRef.current
    const timesScroll = timesScrollRef.current

    const handleDatesScroll = () => checkScroll(datesScroll, setCanScrollDatesLeft, setCanScrollDatesRight)
    const handleTimesScroll = () => checkScroll(timesScroll, setCanScrollTimesLeft, setCanScrollTimesRight)

    if (datesScroll) {
      checkScroll(datesScroll, setCanScrollDatesLeft, setCanScrollDatesRight)
      datesScroll.addEventListener('scroll', handleDatesScroll)
    }

    if (timesScroll) {
      checkScroll(timesScroll, setCanScrollTimesLeft, setCanScrollTimesRight)
      timesScroll.addEventListener('scroll', handleTimesScroll)
    }

    return () => {
      if (datesScroll) datesScroll.removeEventListener('scroll', handleDatesScroll)
      if (timesScroll) timesScroll.removeEventListener('scroll', handleTimesScroll)
    }
  }, [dates, selectedDate])

  const currentDate = dates[selectedDate] || { flights: [], hasFlights: false }

  return (
    <div className="flight-widget-container">
      <div className="controls-columns">
        {showControls && <div className="left-column">
          {/* Выбор маршрута */}
          <div className="selector-group">
            <label className="selector-label">Направление</label>
            <select 
              className="route-select"
              value={selectedRoute}
              onChange={(e) => setSelectedRoute(e.target.value)}
            >
              {routes.map(route => (
                <option key={route.id} value={route.id}>
                  {route.name}
                </option>
              ))}
            </select>
          </div>

          {/* Выбор авиакомпании */}
          <div className="selector-group">
            <label className="selector-label">Авиакомпания</label>
            <select 
              className="airline-select"
              value={selectedAirline}
              onChange={(e) => setSelectedAirline(e.target.value)}
            >
              {availableAirlines.map(code => (
                <option key={code} value={code}>
                  {airlines[code]?.name || code}
                </option>
              ))}
            </select>
          </div>

          {/* Глубина поиска */}
          <div className="selector-group">
            <label className="selector-label">Глубина поиска</label>
            <select 
              className="search-depth-select"
              value={searchDepth}
              onChange={(e) => setSearchDepth(Number(e.target.value))}
            >
              <option value="0">0 дней</option>
              <option value="14">14 дней</option>
              <option value="30">30 дней</option>
              <option value="60">60 дней</option>
            </select>
          </div>
        </div>}

        <div className="center-column">
          {/* Виджет */}
          <div className={`flight-widget-new ${className}`}>
            {isLoading ? (
              <div className="widget-message">Загрузка...</div>
            ) : dates.length === 0 || !dates.some(date => date.hasFlights) ? (
              <div className="widget-message">Нет данных</div>
            ) : (
              <>
        {/* Заголовок */}
        <div className="widget-header">
          <h2>{currentRoute?.name || 'Выберите маршрут'}</h2>
        </div>

        <div className={`selector-wrapper ${!collapseEnabled ? 'collapse-disabled' : ''}`}>
        {/* Панель дат */}
        <div 
          className={`dates-section ${(isDatesExpanded || !collapseEnabled) ? 'expanded' : ''}`}
          onMouseEnter={handleDatesMouseEnter}
          onMouseMove={handleDatesMouseMove}
          onMouseLeave={handleDatesMouseLeave}
        >
          {canScrollDatesLeft && (
            <button className="scroll-arrow scroll-arrow-left" onClick={() => handleScroll(datesScrollRef, 'left')}>
              ‹
            </button>
          )}
          <div 
            className={`dates-scroll ${canScrollDatesLeft ? 'has-left-arrow' : ''} ${canScrollDatesRight ? 'has-right-arrow' : ''}`}
            ref={datesScrollRef}
          >
            {dates.map((date) => {
              const priceInfo = getDatePriceInfo(date)
              
              // Проверяем, совпадает ли цена с выбранной
              const isSamePrice = priceInfo.hasFlights && selectedPrice != null && priceInfo.price === selectedPrice
              
              return (
                <button
                  key={date.id}
                  className={`date-pill ${selectedDate === date.id ? 'selected' : ''} ${!date.hasFlights ? 'no-flights' : ''}`}
                  onClick={() => handleDateClick(date.id)}
                  disabled={!date.hasFlights}
                  ref={(el) => {
                    dateRefs.current[date.id] = el
                  }}
                >
                  <span className="date-label">
                    <span className="date-main">{date.day} {date.month}</span>
                    <span className="date-weekday-wrapper">
                      <span className="date-dot">·</span>
                      <span className="date-weekday">{date.weekday}</span>
                    </span>
                    {priceInfo.hasFlights && selectedDate !== date.id && selectedPrice && priceInfo.price < selectedPrice && showPriceIndicator && (
                      <span className="price-indicator"></span>
                    )}
                  </span>
                  {priceInfo.hasFlights ? (
                    selectedDate === date.id ? (
                      <span className="date-selected-text">выбрано</span>
                    ) : isSamePrice ? (
                      <span className="date-price price-equal">та же цена</span>
                    ) : (
                      <span className={`date-price ${getPriceTone(priceInfo.price)}`}>
                        {priceInfo.label && <span className="price-label">{priceInfo.label} </span>}
                        {formatPriceDisplay(priceInfo.price)}
                      </span>
                    )
                  ) : (
                    <span className="date-no-flights">нет прямых</span>
                  )}
                </button>
              )
            })}
          </div>
          {canScrollDatesRight && (
            <button className="scroll-arrow scroll-arrow-right" onClick={() => handleScroll(datesScrollRef, 'right')}>
              ›
            </button>
          )}
        </div>

        {/* Панель времени */}
        {currentDate.hasFlights && (
          <div className="times-section">
            {canScrollTimesLeft && (
              <button className="scroll-arrow scroll-arrow-left" onClick={() => handleScroll(timesScrollRef, 'left')}>
                ‹
              </button>
            )}
            <div 
              className={`times-scroll ${canScrollTimesLeft ? 'has-left-arrow' : ''} ${canScrollTimesRight ? 'has-right-arrow' : ''}`}
              ref={timesScrollRef}
            >
              {currentDate.flights.map((flight) => {
                const isSamePrice = selectedPrice != null && flight.price === selectedPrice && flight.time !== selectedTime
                return (
                  <button
                    key={flight.time}
                    className={`time-pill ${selectedTime === flight.time ? 'selected' : ''}`}
                    onClick={() => handleTimeClick(flight.time)}
                    ref={(el) => { timeRefs.current[flight.time] = el }}
                  >
                    <span className="time-value">{flight.time}</span>
                    {selectedTime === flight.time ? (
                      <span className={`time-price ${getPriceTone(flight.price)}`}>
                        {formatPriceDisplay(flight.price, flight.time)}
                      </span>
                    ) : isSamePrice ? (
                      <span className="time-price price-equal">та же цена</span>
                    ) : (
                      <span className={`time-price ${getPriceTone(flight.price)}`}>
                        {formatPriceDisplay(flight.price, flight.time)}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
            {canScrollTimesRight && (
              <button className="scroll-arrow scroll-arrow-right" onClick={() => handleScroll(timesScrollRef, 'right')}>
                ›
              </button>
            )}
          </div>
        )}
        </div>

        {/* Детали рейса */}
        {flightDetails && (
          <div className="flight-details">
            <div className="flight-header">
              <div className="airline-info">
                <img 
                  src={`https://img.avs.io/pics/al_square/${flightDetails.airlineCode}@avif?rs=fit:120:120`}
                  alt={flightDetails.airline}
                  className="airline-logo"
                  onError={(e) => {
                    e.target.style.display = 'none'
                  }}
                />
                <div>
                  <div className="airline-name">{flightDetails.airline}</div>
                  <div className="flight-duration">1ч 35м в полёте</div>
                </div>
              </div>
              <button className="details-button">Подробнее</button>
            </div>
            
            <div className="route-details">
              <div className="route-point">
                <div className="route-icon"></div>
                <div className="route-info">
                  <div className="route-time">{flightDetails.departureTime}</div>
                  <div className="route-date">2 ноя, вс</div>
                </div>
                <div className="route-location">
                  <div className="location-city">Москва</div>
                  <div className="location-airport">Шереметьево, SVO</div>
                </div>
              </div>
              
              <div className="route-line"></div>
              
              <div className="route-point">
                <div className="route-icon"></div>
                <div className="route-info">
                  <div className="route-time">{flightDetails.arrivalTime}</div>
                  <div className="route-date">2 ноя, вс</div>
                </div>
                <div className="route-location">
                  <div className="location-city">Санкт-Петербург</div>
                  <div className="location-airport">Пулково, LED</div>
                </div>
              </div>
            </div>
          </div>
        )}
              </>
            )}
          </div>
        </div>

        {showControls && <div className="right-column">
          {/* Тип расчета цен для дней */}
          <div className="selector-group">
            <label className="selector-label">Тип расчета цен для дней</label>
            <select 
              className="mode-select"
              value={priceMode}
              onChange={(e) => {
                const newMode = e.target.value
                setPriceMode(newMode)
                setIsTimeComparisonActive(false)
                
                // При переключении на "Самые дешевые", выбираем самый дешевый рейс
                if (newMode === 'cheapest') {
                  if (dates[selectedDate] && dates[selectedDate].flights.length > 0) {
                    const cheapestFlight = dates[selectedDate].flights.reduce((min, flight) => 
                      flight.price < min.price ? flight : min
                    )
                    setSelectedTime(cheapestFlight.time)
                    setFlightDetails(generateFlightDetails(cheapestFlight.time, selectedAirline))
                  }
                }
              }}
            >
              <option value="cheapest">Самые дешевые</option>
              <option value="by-time">Сначала цена, потом время</option>
              <option value="by-time-nearby">Сначала цена, потом время, плюс соседние вылеты</option>
            </select>
          </div>

          {/* Настройка сворачивания */}
          <div className="selector-group">
            <label className="selector-label">Сворачивание</label>
            <select 
              className="collapse-select"
              value={collapseEnabled ? 'enabled' : 'disabled'}
              onChange={(e) => {
                const enabled = e.target.value === 'enabled'
                setCollapseEnabled(enabled)
                if (!enabled) {
                  setIsDatesExpanded(true) // Разворачиваем даты при отключении
                } else {
                  setIsDatesExpanded(false) // Сворачиваем даты при включении
                }
              }}
            >
              <option value="enabled">Включено</option>
              <option value="disabled">Отключено</option>
            </select>
          </div>

          {/* Индикатор дешевых цен - показывается только при включенном сворачивании */}
          {collapseEnabled && (
            <div className="selector-group">
              <label className="selector-label">Индикатор дешевых цен</label>
              <select 
                className="price-indicator-select"
                value={showPriceIndicator ? 'enabled' : 'disabled'}
                onChange={(e) => setShowPriceIndicator(e.target.value === 'enabled')}
              >
                <option value="enabled">Включен</option>
                <option value="disabled">Отключен</option>
              </select>
            </div>
          )}

          {/* Сворачивание при клике на дату - показывается только при включенном сворачивании */}
          {collapseEnabled && (
            <div className="selector-group">
              <label className="selector-label">Сворачивание при клике</label>
              <select 
                className="collapse-on-click-select"
                value={collapseOnClick ? 'enabled' : 'disabled'}
                onChange={(e) => setCollapseOnClick(e.target.value === 'enabled')}
              >
                <option value="enabled">Включено</option>
                <option value="disabled">Отключено</option>
              </select>
            </div>
          )}

          {/* Режим отображения цен */}
          <div className="selector-group">
            <label className="selector-label">Отображение цен</label>
            <select 
              className="price-display-select"
              value={priceDisplayMode}
              onChange={(e) => setPriceDisplayMode(e.target.value)}
            >
              <option value="absolute">Показываем цену</option>
              <option value="difference">Показываем разницу в цене</option>
            </select>
          </div>

          {/* Количество показываемых дат */}
          <div className="selector-group">
            <label className="selector-label">Количество дат</label>
            <select 
              className="dates-count-select"
              value={visibleDatesCount}
              onChange={(e) => setVisibleDatesCount(Number(e.target.value))}
            >
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
              <option value="5">5</option>
              <option value="6">6</option>
              <option value="7">7</option>
              <option value="8">8</option>
              <option value="9">9</option>
            </select>
          </div>

          {/* Выбор начального дня */}
          <div className="selector-group">
            <label className="selector-label">Выбор начального дня</label>
            <select 
              className="initial-day-select"
              value={initialDayMode}
              onChange={(e) => setInitialDayMode(e.target.value)}
            >
              <option value="first">Самый дешевый в первый день</option>
              <option value="cheapest">Самый дешевый перелет</option>
            </select>
          </div>
        </div>}
      </div>
    </div>
  )
}

export default FlightWidget
