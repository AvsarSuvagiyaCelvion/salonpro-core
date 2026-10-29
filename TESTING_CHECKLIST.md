# 🧪 SalonPro ERP - Complete Developer Testing & QA Checklist

આ ચેકલિસ્ટ એક ડેવલપર તરીકે ક્લાયન્ટને લિંક મોકલતા પહેલાં આખા સોફ્ટવેરનું શરુઆતથી અંત સુધી (A to Z) એન્ડ-ટુ-એન્ડ ટેસ્ટિંગ કરવા માટે છે.
દરેક સ્ટેપ ચેક કરતાં જાવ અને `[ ]` ને બદલે `[x]` કરતા જાવ.

---

## 📋 Table of Contents
1. [તૈયારી & એન્વાયર્નમેન્ટ ચેક](#phase-1-environment--database-check)
2. [સુપર એડમિન પેનલ ટેસ્ટિંગ (`/admin`)](#phase-2-super-admin-testing)
3. [પાર્લર ૧ (બ્રાન્ચ ૧) રજીસ્ટ્રેશન & સેટઅપ](#phase-3-parlor-1-registration--setup)
4. [ઓનલાઇન કસ્ટમર બુકિંગ ફ્લો (`/[slug]`)](#phase-4-customer-online-booking-flow)
5. [સલૂન ઓનર કેલેન્ડર & લાઈવ ફ્લોર (`/app/appointments`)](#phase-5-time-slot-calendar--live-floor)
6. [૧૦-સેકન્ડ GST POS બિલિંગ & WhatsApp ઇન્વોઇસ](#phase-6-10-second-gst-pos-billing)
7. [પાર્લર ૨ રજીસ્ટ્રેશન & ૧૦૦% ડેટા સેપરેશન ટેસ્ટ](#phase-7-parlor-2--multi-tenant-isolation-test)
8. [મોબાઇલ & ક્રોસ-ડિવાઇસ રિસ્પોન્સિવનેસ ટેસ્ટ](#phase-8-mobile-responsiveness-test)
9. [ક્લાયન્ટ હેન્ડઓવર ફાઇનલ કન્ફર્મેશન](#phase-9-final-handover-readiness)

---

## Phase 1: Environment & Database Check
- [done ] **Vercel Environment Variables:** Vercel Dashboard માં `DATABASE_URL` સેટ થયેલો છે.
- [done ] **Supabase લાઈવ સ્ટેટસ:** `subscription_plans` ટેબલમાં Basic, Pro, Premium પ્લાન હાજર છે.
- [ done] **પ્રોડક્શન બિલ્ડ ગ્રીન:** `npm run build` લોકલ અને Vercel બંને પર Exit Code 0 સાથે પાસ થયેલું છે.

---

## Phase 2: Super Admin Testing (`/admin`)
- [done ] **Admin Login:** બ્રાઉઝરમાં `/admin/login` ખોલો.
  * Email: `adminsalonpro@gmail.com`
  * Password વડે સફળતાપૂર્વક લોગિન થાય છે.
- [ done] **Subscription Plans (`/admin/plans`):**
  * Basic (₹499), Pro (₹999), Premium (₹1999) ત્રણેય કાર્ડ્સ દેખાય છે.
  * **Edit Test:** કોઈ પ્લાન પર `Edit Plan & Gates` ક્લિક કરીને કિંમત કે લિમિટ બદલીને સેવ કરો — ફેરફાર તરત જ સેવ થાય છે.
  * **Toggle Active:** પાવર બટન દબાવતાં Active / Inactive થાય છે.
  * **Delete Button:** કાર્ડ પર લાલ કલરનું Delete (Trash2) બટન કામ કરે છે.
- [ ] **Salons Overview (`/admin/salons`):** બધા રજીસ્ટર્ડ સલૂનની યાદી અને સબસ્ક્રિપ્શન સ્ટેટસ દેખાય છે.

---

## Phase 3: Parlor 1 Registration & Setup
- [done ] **નવું સલૂન રજીસ્ટર કરો:** બ્રાઉઝરમાં `/register-salon` ખોલો.
  * સલૂનનું નામ: `Pari Beauty Studio - Branch 1`
  * માલિકનું નામ: `Pooja Patel`
  * Email: `pari.branch1@gmail.com`
  * Mobile: `9876500001`
  * City: `Ahmedabad`
  * Password: `Password@123`
  * Plan: `7-Day Free Trial Demo` સિલેક્ટ કરો.
  * Submit કરો -> રજીસ્ટ્રેશન સફળ થાય છે અને સીધું `/app` ડેશબોર્ડ ખુલે છે.
- [done ] **સર્વિસિસ ઉમેરો (`/app/services`):**
  * Service 1: `Haircut & Blowdry` (₹400, 30 Mins, Category: Hair)
  * Service 2: `Fruit Glow Facial` (₹800, 45 Mins, Category: Facial)
  * Service 3: `Bridal Makeup Trial` (₹2,500, 60 Mins, Category: Makeup)
  * ચકાસો: બધી સર્વિસિસ સેવ થઈને લિસ્ટમાં દેખાય છે.
- [done ] **સ્ટાફ (કારીગરો) ઉમેરો (`/app/staff`):**
  * Staff 1: `Kajal Sharma` (Senior Stylist, Commission: 10%)
  * Staff 2: `Neha Varma` (Esthetician, Commission: 15%)
  * ચકાસો: સ્ટાફ સફળતાપૂર્વક સેવ થાય છે.
- [ ] **સલૂન સેટિંગ્સ & બુકિંગ લિંક (`/app/settings`):**
  * સમય ચકાસો (ઓપન ટાઈમ: 10:00 AM, ક્લોઝ ટાઈમ: 08:00 PM).
  * બુકિંગ લિંક કોપી કરો: `Copy Link` બટન પર ક્લિક કરતાં લિંક ક્લિપબોર્ડમાં કોપી થાય છે (`/[slug]`).

---

## Phase 4: Customer Online Booking Flow
*(ગ્રાહકની જેમ ટેસ્ટ કરો - મોબાઇલમાં અથવા પ્રાઇવેટ/ઇનકોગ્નિટો ટેબમાં લિંક ખોલો)*
- [ ] **પાર્લર ૧ ની લિંક ખોલો:** `https://yourdomain.com/pari-beauty-studio-branch-1`
- [ ] **સ્ટેપ ૧ (સર્વિસ પસંદ કરો):** `Fruit Glow Facial` (₹800) પસંદ કરો.
- [ ] **સ્ટેપ ૨ (સ્ટાફ પસંદ કરો):** `Anyone Available` અથવા `Neha Varma` પસંદ કરો.
- [ ] **સ્ટેપ ૩ (તારીખ & સ્લોટ):**
  * આજની અથવા આવતીકાલની તારીખ પસંદ કરો.
  * ઉપલબ્ધ સમય સ્લોટ પસંદ કરો (દા.ત. `11:00 AM`).
- [ ] **સ્ટેપ ૪ (કસ્ટમર ડિટેઇલ્સ):**
  * નામ: `Anjali Mehta`
  * મોબાઈલ: `9988776655`
  * 4-Digit Security PIN: `1234`
  * `Confirm & Book Appointment` પર ક્લિક કરો.
- [ ] **બુકિંગ કન્ફર્મેશન:** સ્ક્રીન પર સફળતાપૂર્વક કન્ફર્મેશન કાર્ડ, તારીખ અને સમય દેખાય છે.

---

## Phase 5: Time Slot Calendar & Live Floor
*(પાછા પાર્લર ૧ ના ઓનર ડેશબોર્ડમાં આવો)*
- [ ] **Appointments પેજ ખોલો (`/app/appointments`):**
  * **Time Slot Calendar View:** બરાબર `11:00 AM to 12:00 PM` ના સ્લોટમાં `Anjali Mehta` નું બુકિંગ કાર્ડ બેસેલું દેખાય છે!
  * કાર્ડમાં કસ્ટમર નામ, મોબાઈલ, `Fruit Glow Facial (₹800)` અને સ્ટાફનું નામ દેખાય છે.
  * સ્ટેટસ: `SCHEDULED` (બ્લૂ બેજ).
- [ ] **Mark Arrived ટેસ્ટ:** `Mark Arrived` બટન દબાવો -> સ્ટેટસ બદલાઈને `ARRIVED` (પીળો બેજ) થઈ જાય છે.
- [ ] **Switch View ટેસ્ટ:** ઉપર `Card List` બટન દબાવો -> કાર્ડ લિસ્ટ વ્યુ ખુલે છે. પાછું `Time Slot Calendar` દબાવો -> ટાઇમલાઇન કેલેન્ડર આવે છે.
- [ ] **ખાલી સ્લોટ ટેસ્ટ:** કોઈ ખાલી સ્લોટ (દા.ત. `03:00 PM`) પર ક્લિક કરો -> 03:00 PM નો સમય પ્રી-ફિલ થઈને બુકિંગ મોડલ ખુલે છે.

---

## Phase 6: 10-Second GST POS Billing
- [ ] **Start Session:** કસ્ટમરના કાર્ડ પર `Start POS` બટન દબાવો.
  * સીધા લાઈવ સેશન ફ્લોર (`/app/live`) પર રીડાયરેક્ટ થાય છે.
  * ચેર પર Anjali Mehta બેઠેલા દેખાય છે.
- [ ] **બિલિંગ પૂર્ણ કરો:**
  * સેશન કમ્પ્લીટ કરો -> POS બિલિંગ સ્ક્રીન આવે છે.
  * પેમેન્ટ મોડ સિલેક્ટ કરો: `UPI` અથવા `Cash`.
  * `Complete & Generate Invoice` દબાવો.
- [ ] **ડિજિટલ રસીદ & WhatsApp:**
  * રસીદ પેજ ખુલે છે (`/b/[invoiceNumber]`).
  * જીએસટી બ્રેકઅપ, સલૂનનું નામ, સર્વિસ વિગત અને બિલ ટોટલ બરાબર દેખાય છે.
  * `Send on WhatsApp` બટન દબાવતાં કસ્ટમરના ફોન પર બિલ લિંક સાથેનો મેસેજ તૈયાર થાય છે.

---

## Phase 7: Parlor 2 & Multi-Tenant Isolation Test
*(ક્લાયન્ટ પાસે ૨ બ્યુટી પાર્લર છે, માટે આ ટેસ્ટ સૌથી મહત્ત્વનો છે)*
- [ ] **પાર્લર ૨ રજીસ્ટર કરો:** (ઇનકોગ્નિટો ટેબમાં `/register-salon` ખોલો)
  * સલૂન નામ: `Pari Beauty Studio - Branch 2`
  * Email: `pari.branch2@gmail.com` (અલગ ઈમેઈલ)
  * Mobile: `9876500002`
  * Plan: `7-Day Free Trial Demo`
  * એકાઉન્ટ બનાવો.
- [ ] **પાર્લર ૨ માં સ્ટાફ & સર્વિસ ઉમેરો:**
  * Service: `Diamond Bleach` (₹500)
  * Staff: `Sonal Joshi`
- [ ] **પાર્લર ૨ ની લિંક પરથી બુકિંગ કરો:**
  * લિંક: `https://yourdomain.com/pari-beauty-studio-branch-2`
  * કસ્ટમર: `Bhavna Patel` (મોબાઈલ: `9911223344`)
  * સમય: `02:00 PM`
- [ ] **🔒 ૧૦૦% ડેટા સેપરેશન વેરિફિકેશન:**
  * પાર્લર ૨ ના કેલેન્ડરમાં માત્ર `Bhavna Patel` જ દેખાય છે. પાર્લર ૧ ની `Anjali Mehta` અહીં **બિલકુલ દેખાતી નથી**.
  * પાર્લર ૧ ના કેલેન્ડરમાં માત્ર `Anjali Mehta` જ દેખાય છે. પાર્લર ૨ ની `Bhavna Patel` ત્યાં **બિલકુલ દેખાતી નથી**.
  * બંને પાર્લરનો ગલ્લો, કસ્ટમર લિસ્ટ અને સ્ટાફ ૧૦૦% અલગ છે.

---

## Phase 8: Mobile Responsiveness Test
- [ ] **સ્માર્ટફોન વ્યુ (Viewport 375px / 390px):**
  * બ્રાઉઝરમાં F12 દબાવીને Mobile Toggle (Ctrl + Shift + M) ચાલુ કરો.
  * **ઓનલાઇન બુકિંગ પેજ:** બટનો મોટા અને ફિંગર-ટેપ ફ્રેન્ડલી છે, કેટેગરી સ્લાઇડર સ્મૂથ ફરે છે.
  * **ઓનર ડેશબોર્ડ:** હેમ્બર્ગર મેનુ (☰) દબાવતાં સાઇડબાર ડ્રોવર સ્મૂથ ખુલે છે અને બંધ થાય છે.
  * **POS બિલિંગ:** મોબાઇલમાં કોઈ હોરીઝોન્ટલ સ્ક્રોલબાર કે કપાયેલા બટન નથી આવતા.

---

## Phase 9: Final Handover Readiness
બધા સ્ટેપ્સ પૂરા થયા પછી:
- [ ] સુપર એડમિનમાંથી ટેસ્ટ દરમિયાન બનેલા નકામા ટેસ્ટ ડેટા સાફ કરવો હોય તો કરી શકાય છે.
- [ ] ક્લાયન્ટને મોકલવા માટેની લાઈવ Vercel લિંક તૈયાર છે.
- [ ] ક્લાયન્ટને બંને પાર્લર માટે ૨ અલગ ઈમેઈલથી એકાઉન્ટ બનાવવાની સૂચના તૈયાર છે.

---
🎯 **તમારો સોફ્ટવેર ક્લાયન્ટને ડેમો આપવા માટે ૧૦૦% રેડી છે!**

