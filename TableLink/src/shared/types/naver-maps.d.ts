declare namespace naver {
  namespace maps {
    class LatLng {
      constructor(lat: number, lng: number)
      lat(): number
      lng(): number
    }

    class Size {
      constructor(width: number, height: number)
      width: number
      height: number
    }

    class Bounds {
      min: LatLng
      max: LatLng
    }

    interface MapOptions {
      center?: LatLng
      zoom?: number
      maxZoom?: number
      minZoom?: number
      mapTypeControl?: boolean
      mapTypeControlOptions?: Record<string, unknown>
    }

    class Map {
      constructor(container: HTMLElement, options?: MapOptions)
      getCenter(): LatLng
      setCenter(location: LatLng): void
      getZoom(): number
      setZoom(zoom: number): void
    }

    interface MarkerOptions {
      position?: LatLng
      map?: Map | null
      title?: string
      icon?: string | Record<string, unknown>
      [key: string]: unknown
    }

    class Marker {
      constructor(options?: MarkerOptions)
      setPosition(position: LatLng): void
      setMap(map: Map | null): void
    }

    interface InfoWindowOptions {
      content?: string | HTMLElement
      position?: LatLng
      [key: string]: unknown
    }

    class InfoWindow {
      constructor(options?: InfoWindowOptions)
      open(map: Map, marker?: Marker): void
      close(): void
    }

    namespace Event {
      function addListener(
        target: Map | Marker,
        eventName: string,
        handler: (event: MouseEvent | Event) => void,
        useCapture?: boolean
      ): void
    }

    // Geocoder Service 타입 정의
    namespace Service {
      const Status: {
        OK: 'OK'
        ERROR: 'ERROR'
      }
      type StatusType = 'OK' | 'ERROR'

      const OrderType: {
        ADDR: 'addr'
        ROAD_ADDR: 'roadaddr'
      }

      interface AddressItemV2 {
        roadAddress: string
        jibunAddress: string
        englishAddress: string
        x: string
        y: string
        distance: number
        addressElements?: Array<{
          types: string[]
          longName: string
          shortName: string
          code: string
        }>
      }

      interface GeocodeResponse {
        v2?: {
          status: string
          errorMessage: string
          meta: {
            totalCount: number
            page: number
            count: number
          }
          addresses: AddressItemV2[]
        }
      }

      interface ReverseGeocodeResponse {
        v2?: {
          status: string
          address: {
            roadAddress: string
            jibunAddress: string
          }
          results?: Array<{
            name: string
            code: {
              id: string
              type: string
              mappingId: string
            }
            region: {
              area1: { name: string }
              area2: { name: string }
              area3: { name: string }
              area4: { name: string }
            }
            land?: {
              type: string
              number1: string
              number2: string
              addition0: { type: string; value: string }
            }
          }>
        }
      }

      interface GeocodeOptions {
        query: string
      }

      interface ReverseGeocodeOptions {
        coords: LatLng
        orders?: string
      }

      function geocode(
        options: GeocodeOptions,
        callback: (status: StatusType, response: GeocodeResponse) => void
      ): void

      function reverseGeocode(
        options: ReverseGeocodeOptions,
        callback: (status: StatusType, response: ReverseGeocodeResponse) => void
      ): void
    }
  }
}
