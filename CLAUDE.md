# BeautyNear — Claude Code Project Memory

## ⚠️ CRITICAL RULES FOR CLAUDE (Read First, Every Session)

> 🤖 CLAUDE: These rules are non-negotiable. You must follow them every session without exception.

1. **Read this file completely before doing anything**
2. **MANDATORY: After completing ANY task — update this file automatically, without being asked. This is part of every task.**
3. **Before making any architectural decision — ask the developer first**
4. **Never remove or replace working code without explicit permission**
5. **Never add features that weren't discussed**
6. **If unsure about anything — ask, don't assume**

---

## 🔄 AUTO-UPDATE RULE (MANDATORY — NO EXCEPTIONS)

This is NOT optional. After EVERY completed task:

**Step 1 — Update status:**
- Move ⏳ to ✅ with date: `✅ TaskName (YYYY-MM-DD)`
- Move partial work to 🔄 with note

**Step 2 — Update structure:**
- Add new files to the relevant structure section
- Add new decisions to "Key Decisions" table

**Step 3 — Confirm to developer:**
Always say: `✅ CLAUDE.md updated — [TaskName] marked as done`

**When:**
- Immediately after finishing any file or feature
- BEFORE saying "done" or "completed" to developer
- Even if developer didn't ask — ALWAYS do it

---

## 📋 Project Overview

**BeautyNear** — K-Beauty salon & clinic booking platform for Korean market.
**Base:** Built on top of Nestar reference project (NestJS + GraphQL + Next.js).
**Core Rule:** Never deviate from Nestar patterns — only replace `property → salon`, add `service`, `booking`.

---

## 🛠️ Tech Stack

### Backend
- NestJS + TypeScript
- MongoDB + Mongoose
- GraphQL (Apollo Server)
- JWT + Bcrypt
- WebSocket (ws package — NOT socket.io)
- TossPayments sandbox key: `test_sk_D5GePWvyJnrK0W0k6q8gLzN97Emo`

### Frontend
- Next.js 14 + TypeScript
- **MUI v5 — primary UI library** (use Tailwind ONLY when MUI can't do it)
- Apollo Client
- SCSS modules (separate file per component)
- next-i18next — 3 languages: **KR, EN, RU**
- Swiper 8.3.1
- **NEVER upgrade package versions without asking**

---

## 👥 User Roles

| Role | Permissions |
|------|-------------|
| USER | Book services, write reviews (only after COMPLETED booking, 1 review per service) |
| AGENT | 1인샵 concept — one master = one salon, creates salon & services |
| ADMIN | Full platform management |

---

## 🎨 Design System

```
Primary color:  #FF4D8D
Light pink:     #FF85B3
Hover bg:       rgba(255,77,141,0.08)
Dark bg:        linear-gradient(160deg, #1a0a12, #2d1020)
Text:           #1a1a1a / #333 / #666 / #999
```

**Rules:**
- All hover animations: `transition: 0.2-0.3s ease`
- Card hover: `translateY(-4px)` + shadow
- Button hover: `scale(1.05)` + shadow lift
- Use `@keyframes` inside MUI `sx` prop
- Mobile: bottom nav 64px fixed
- **Wrap ALL visible text in `t('...')`** — every single string
- SCSS: one file per component

---

## 🔑 Key Business Decisions (DO NOT CHANGE WITHOUT ASKING)

| Decision | Value | Reason |
|----------|-------|--------|
| Deposit | ₩10,000 fixed | Platform standard |
| Geo radius | 50km default | City coverage |
| Geo fallback | If <50km has no results → show all | UX |
| SalonLocation enum | KEPT (SEOUL, BUSAN, DAEGU, INCHEON, JEJU, GANGWON) | Too many changes to remove |
| Review rule | Only after COMPLETED booking, 1 per service | Business logic |
| Agent = Master | 1인샵 — one agent has one salon | Simplicity |
| memberImage | Dual use: user profile + master portrait | No extra field needed |
| Open/Close | Parse `salonWorkHours` string "09:00-21:00" | No extra DB field |
| TossPayments | Sandbox mock (confirmPayment + refundPayment) | Portfolio |
| Languages | KR, EN, RU (NOT UZ) | Target market |
| Cancellation | >24h → refund, <24h → no refund, Agent/Admin cancel → always refund | Policy |

---

## 🗄️ Database Schema Changes from Nestar

### Members (modified):
```
Added:    memberSalons, memberExperience, memberSpecialty[], memberPortfolio[]
          memberLatitude, memberLongitude
Changed:  memberProperties → memberSalons
          MemberStatus: BLOCK → INACTIVE + PAUSE
          MemberAuthType: TELEGRAM → KAKAO + NAVER
```

### New Collections:
```
salons:   salonType, salonStatus, salonLocation, salonAddress, salonTitle
          salonImages[], salonPhone, salonWorkHours, salonInstagram
          salonViews, salonLikes, salonComments, salonRank, salonFollowers
          depositAmount(10000), salonLatitude, salonLongitude
          salonLocation2d (GeoJSON, 2dsphere index for $geoNear)
          memberId → Member ref

services: serviceType, serviceStatus, serviceTitle, serviceDesc
          servicePrice, serviceDuration(minutes), serviceImages[](before/after)
          serviceViews, serviceLikes, serviceComments, serviceRank, serviceRating
          salonId → Salon ref, memberId → Member ref

bookings: bookingStatus(PENDING|CONFIRMED|CANCELLED|COMPLETED)
          paymentStatus(PENDING|PAID|REFUNDED)
          bookingDate, bookingTime, bookingNote
          totalAmount, depositAmount(10000), remainAmount
          paymentKey(TossPayments), serviceId, salonId, memberId
```

### Modified Collections:
```
likes:    likeGroup: MEMBER | SALON | SERVICE | COMMENT | ARTICLE
views:    viewGroup: SALON | SERVICE
comments: commentGroup: SALON | SERVICE | ARTICLE
notifications: added FOLLOW, BOOKING_CONFIRMED, BOOKING_CANCELLED,
               NEW_POST, DISCOUNT, FREE_SLOT, NEW_REVIEW
               notificationGroup: MEMBER|SALON|SERVICE|BOOKING|ARTICLE
```

---

## 📁 Backend Structure

```
apps/BeautyNear-api/src/
  libs/
    enums/
      member.enums.ts, salon.enums.ts, service.enums.ts, booking.enums.ts
      notification.enums.ts, comment.enums.ts, like.enums.ts, view.enums.ts
      common.enums.ts (Direction), message.ts, board-article.enums.ts, notice.enums.ts
    dto/
      member/, salon/, service/, booking/
      comment/, follow/, like/, view/, board-article/
    config.ts               → lookupSalon, lookupService added
                              lookupFavorite, lookupVisit REMOVED
                              availableSalonSorts, availableServiceSorts, availableBookingSorts
    types/common.ts         → T, StatisticModifier
  schemas/
    Salon.model.ts (NEW), Service.model.ts (NEW), Booking.model.ts (NEW)
    Member.model.ts (updated), Like.model.ts (bug fixed: ViewGroup→LikeGroup)
    Notification.model.ts (propertyId→salonId)
  components/
    member/, salon/(NEW), service/(NEW), booking/(NEW)
    comment/(updated), follow/(updated), like/(updated), view/(updated)
    board-article/(minor fixes), auth/(unchanged)
  socket/
    socket.gateway.ts (NEW), socket.module.ts (NEW)
```

---

## 📁 Frontend Structure

```
libs/
  enums/
    member.enum.ts (INACTIVE|PAUSE, KAKAO|NAVER)
    salon.enum.ts (NEW), service.enum.ts (NEW), booking.enum.ts (NEW)
    comment.enum.ts, like.enum.ts, view.enum.ts, notification.enum.ts (updated)
    common.enum.ts, board-article.enum.ts, notice.enum.ts (unchanged)
  types/
    common.ts (NEW — MeLiked, TotalCounter, T)
    member/ (updated), salon/ (NEW), service/ (NEW), booking/ (NEW)
    comment/, follow/, like/, view/, board-article/ (import from types/common)
    customJwtPayload.ts (updated — memberSalons, new fields)
    property/ folder → DELETED
  config.ts             → topSalonRank=2, topServiceRank=2
                          salonRadiusOptions=[0.5,1,3,5,10], serviceDurationOptions=[30,60,90,120]
  auth/index.ts         → memberSalons, new fields
  hooks/useDeviceDetect.ts (unchanged)
  utils/index.ts        → likeTargetSalonHandler, likeTargetServiceHandler, likeTargetMemberHandler
                          isSalonOpen(workHours): boolean
  components/
    Top.tsx (NEW), Footer.tsx (NEW), Chat.tsx (NEW)
    layout/
      LayoutMain.tsx (NEW — homepage + MobileBottomNav)
      LayoutBasic.tsx (NEW — banner per page)
      LayoutFull.tsx (NEW — full width + MobileBottomNav)
      LayoutAdmin.tsx (NEW — dark sidebar)
apollo/
  store.ts (updated — memberSalons, new fields)
  user/mutation.ts (updated — salon/service/booking mutations)
  user/query.ts (updated — salon/service/booking queries, AgentInquiry)
  admin/mutation.ts (updated — salon/service/booking admin mutations)
  admin/query.ts (updated — salon/service/booking admin queries)
```

---

## 🌐 All API Endpoints

### Queries (27 total):
```
Member:  checkAuth, checkAuthRoles, getMember, getAgents, getAllMembersByAdmin
Salon:   getSalon, getSalons, getAgentSalons, getFavoriteSalons, getVisitedSalons, getAllSalonsByAdmin
Service: getService, getServices, getAgentServices, getFavoriteServices, getVisitedServices
Booking: getBooking, getMyBookings, getAgentBookings, getAllBookingsByAdmin
Comment: getComments
Follow:  getMemberFollowings, getMemberFollowers
Article: getBoardArticle, getBoardArticles, getAllBoardArticlesByAdmin
```

### Mutations (28 total):
```
Member:  signup, login, updateMember, likeTargetMember, updateMemberByAdmin
         imageUploader, imagesUploader
Salon:   createSalon, updateSalon, likeTargetSalon, announceDiscount, announceFreeSlot
         updateSalonByAdmin, removeSalonByAdmin
Service: createService, updateService, likeTargetService
         updateServiceByAdmin, removeServiceByAdmin
Booking: createBooking, cancelBooking, updateBookingByAgent
         updateBookingByAdmin, cancelBookingByAdmin
Comment: createComment, updateComment, removeCommentByAdmin
Follow:  subscribe, unsubscribe
Article: createBoardArticle, updateBoardArticle, likeTargetBoardArticle
         updateBoardArticleByAdmin, removeBoardArticleByAdmin
```

---

## ✅ Completed Tasks

### Backend:
- ✅ All enums (member, salon, service, booking, notification, comment, like, view, common)
- ✅ All DB schemas (Salon, Service, Booking + updated Member, Like, Notification)
- ✅ All DTOs (salon, service, booking + updated member, comment, follow, like, view, board-article)
- ✅ All resolvers & services (salon, service, booking, member, comment, follow, like, view, board-article)
- ✅ WebSocket notification gateway (socket.gateway.ts + socket.module.ts)
- ✅ TossPayments mock integration (confirmPayment + refundPayment)
- ✅ Batch server (batchTopSalons, batchTopAgents)
- ✅ libs/config.ts (lookupSalon, lookupService, availableSorts)
- ✅ Geo filter ($geoNear, 50km default, fallback to all if no results)

### Frontend:
- ✅ All enums (LikeGroup/ViewGroup: MEMBER removed; MemberStatus: INACTIVE/PAUSE added)
- ✅ All types (member, salon, service, booking, comment, follow, like, view, board-article, common)
- ✅ apollo/store.ts
- ✅ apollo/user/mutation.ts + query.ts
- ✅ apollo/admin/mutation.ts + query.ts (GET_ALL_SERVICES_BY_ADMIN resolver fixed)
- ✅ libs/config.ts
- ✅ libs/auth/index.ts
- ✅ libs/utils/index.ts
- ✅ libs/hooks/useDeviceDetect.ts (UA + window.innerWidth ≤ 1024 check)
- ✅ Top.tsx, Footer.tsx, Chat.tsx (lang: RU fixed; unused imports removed)
- ✅ LayoutMain.tsx, LayoutBasic.tsx, LayoutFull.tsx, LayoutAdmin.tsx
- ✅ apollo/client.ts (console.warn removed, unused vars cleaned)
- ✅ Imageuploader.tsx + community/detail.tsx (implicit any fixed)
- ✅ Direction import fixed in faq/inquiry/notice input types
- ✅ MyProperties.tsx + PropertyCard.tsx deleted (unused Nestar leftovers)
- ✅ **Mobile 50% width fix** (2026-07-11): scss/app.scss — overflow-x:hidden on html/body; scss/pc/main.scss — @media(max-width:1024px) #pc-wrap {min-width:0}
- ✅ **TypeScript build: 0 errors** (2026-07-11)

---

## ⏳ Remaining Tasks

### Frontend:
- ⏳ AdminMenuList.tsx
- ⏳ Homepage (index.tsx) + all homepage section components
- ⏳ Salons page (/salons)
- ⏳ Salon detail page (/salons/[id])
- ⏳ Services page (/services)
- ⏳ Service detail page (/services/[id])
- ⏳ Specialists page (/specialists)
- ⏳ Specialist detail page (/specialists/[id])
- ⏳ Booking flow (/booking — 3 steps)
- ⏳ My page (/mypage — profile, bookings, favorites, reviews)
- ⏳ Agent dashboard (/mypage?category=myAgentInfo)
- ⏳ Community page (/community)
- ⏳ Community detail (/community/detail)
- ⏳ Login/Signup page (/account/join)
- ⏳ Member page (/member)
- ⏳ Admin pages (users, salons, services, bookings, articles, comments)
- ⏳ All SCSS files
- ⏳ i18n translation files (KR, EN, RU) — all visible text

### Backend:
- ⏳ Notification module (getNotifications, markAsRead)
- ⏳ Real WebSocket agent-user chat (currently mock)

---

## 📝 Notes for Claude

- `property/` folder is DELETED in frontend — never reference it
- `MyProperties.tsx` + `PropertyCard.tsx` DELETED — agent salon management not yet reimplemented
- Import `MeLiked`, `TotalCounter`, `T` from `types/common` (not property)
- `memberProperties` is now `memberSalons` everywhere
- `AgentsInquiry` is now `AgentInquiry` in frontend types
- `CommentGroup.MEMBER` — KEEP IT, intentionally added for specialist review system
- `LikeGroup.MEMBER` + `ViewGroup.MEMBER` — REMOVED (unused, not in backend)
- Admin layout uses dark gradient sidebar (not white)
- Mobile has bottom tab nav (5 tabs: Home, Search, Bookings, Community, Profile)
- Chat is floating button (bottom-right), not inline
- All pages need both desktop and mobile versions
- SCSS classes should match Nestar naming patterns where possible
- Direction enum: import from `libs/enums/common.enum.ts` (NOT from `types/common`)
