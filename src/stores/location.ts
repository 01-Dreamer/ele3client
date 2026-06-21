import { ref } from 'vue'
import { defineStore } from 'pinia'

interface Coordinate {
  longitude: number
  latitude: number
  updateTime?: number
}

export const useLocationStore = defineStore('location', () => {
  const currentAddress = ref('云南大学呈贡校区')
  const currentCoordinate = ref<Coordinate | null>(null)

  const setAddress = (address: string) => {
    currentAddress.value = address
  }

  const setCoordinate = (coordinate: Coordinate) => {
    currentCoordinate.value = coordinate
  }

  return {
    currentAddress,
    currentCoordinate,
    setAddress,
    setCoordinate
  }
})
