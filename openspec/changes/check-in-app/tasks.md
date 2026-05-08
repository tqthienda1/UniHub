## 1. Backend API Extensions

- [x] 1.1 Create `GET /admin/workshops/staff/active` in `WorkshopsController` to list workshops where the user is an organizer or staff.
- [x] 1.2 Implement `GET /admin/workshops/:id/registrations/search` to support manual student lookup by name or email.
- [x] 1.3 Ensure the `checkin` response payload includes student details (name, profile picture URL) for visual confirmation.

## 2. Mobile Staff Portal

- [x] 2.1 Update navigation structure in `mobile/App.tsx` to include a `Staff` stack, visible only for `ADMIN` or `STAFF` roles.
- [x] 2.2 Create `StaffWorkshopSelectScreen.tsx` with a list of today's workshops and real-time attendance progress bars.
- [x] 2.3 Implement the workshop selection logic to navigate to the scanner with the appropriate `workshopId`.

## 3. High-Performance Scanner

- [x] 3.1 Install `expo-haptics` and `expo-av` dependencies in the mobile project.
- [x] 3.2 Refactor `QrScannerScreen.tsx` to accept `workshopId` as a route parameter and remove hardcoded placeholders.
- [x] 3.3 Implement `ScannerFeedbackOverlay` component that displays transient Green/Red/Orange states.
- [x] 3.4 Integrate haptic and audio triggers into the `handleBarCodeScanned` callback.
- [x] 3.5 Optimize scan throttling to allow rapid successive scans while preventing duplicate triggers for the same QR code within a 2-second window.

## 4. Manual Operations & Live Data

- [x] 4.1 Create `ManualCheckInScreen.tsx` with a searchable list of `CONFIRMED` registrations for the active workshop.
- [x] 4.2 Add "Manual Check-in" action to students in the list with a confirmation dialog.
- [x] 4.3 Implement WebSocket listeners on the Scanner and Dashboard to keep attendance counts (`checkedInCount / totalCount`) synced with server-side changes.
- [x] java.lang.string cannot be cast to java.lang.boolean khi bundled thành công trên android thì nó báo lỗi vậy
- [x] Android Bundling failed 6037ms index.ts (3008 modules)
Unable to resolve "react-native-gesture-handler" from "node_modules\@react-navigation\stack\lib\module\views\GestureHandlerNative.js"
> 4 | import { PanGestureHandler as PanGestureHandlerNative } from 'react-native-gesture-handler'; fix this bug
- [x]  Failed to fetch workshops: [AxiosError: Network Error] fix this bug
- [x] Failed to fetch staff workshops: [AxiosError: Request failed with status code 404] fix this bug
- [x] When enter mobile app, let user login, only accept Admin of Check-in Staff
- [x] Only show staff dashboard, mobile app cannot register workshop
- [x] fix  Failed to fetch staff workshops: [AxiosError: Request failed with status code 404]
- [x] Fix SafeAreaView deprecation warning using 'react-native-safe-area-context'
- [x] fix when open staff dashboard
src/workshops/workshops.service.ts:406:39 - error TS2339: Property 'id' does not exist on type '{ email: string; fullName: string; }'.

406         id: checkin.registration.user.id,
 Failed to fetch staff workshops: [AxiosError: Request failed with status code 404]
 - [x] fix  Failed to fetch staff workshops: [AxiosError: Request failed with status code 401]
 - [x] fix the staff dashboard doesnt show the workshops, it blank but the system already have 2 workshops
 - [x] delete uppercase first letter in password when login in mobile app
 - [x] handle when scan the qr twice, show message "you already scanned the qr code"
 - [x] Error: Student already checked in, it doesnt appear on UI but show Internal Error and the server show these errors
 - [x] If the qr is invalid or expired, show it on the UI, don't show the Internal Error
