# RBZ System - Complete Startup Guide with New Stages

## 🚀 Your Startup Procedure (Updated)

### Terminal 1: The Database (Run as Administrator)
```cmd
"C:\Program Files\PostgreSQL\18\bin\pg_ctl.exe" -D "C:\pgdata" start
```
✅ Wait for: "server starting"

---

### Terminal 2: The AI Brain (Python)
```cmd
cd Music\RBZ_System\rbz_ai
venv\Scripts\activate
uvicorn main:app --reload
```
✅ Wait for: "Uvicorn running on http://127.0.0.1:8000"

---

### Terminal 3: The Backend Manager (Java)
```cmd
cd Music\RBZ_System\rbz_backend
set JAVA_HOME=C:\Program Files\Java\jdk-21
C:\Maven\apache-maven-3.9.11\bin\mvn spring-boot:run
```
✅ Wait for: "Started LicensingSystemApplication"

---

### Terminal 4: Initialize Product Catalog (ONE TIME ONLY)

**IMPORTANT:** After the backend starts for the FIRST time, run this in a new terminal:

```cmd
cd Music\RBZ_System
initialize-products.bat
```

OR manually:
```cmd
curl -X POST http://localhost:8080/api/products/initialize-catalog
```

✅ You should see: "Product catalog initialized successfully"

**Note:** You only need to do this ONCE. The products will be saved in the database.

---

### Terminal 5: The Frontend (React)
```cmd
cd Music\RBZ_System\rbz-frontend
npm start
```
✅ Wait for: Browser opens at http://localhost:3000

---

## 🎯 What's New - Testing the 4 New Stages

### Stage 2: Ownership Structure 📊
**New Features:**
1. **Shareholding Table** - Manually enter shareholder details
2. **Compliance Validation** - Automatic 50% max & 100% total checks
3. **Document Uploads** (7 types):
   - Application Fee Receipt
   - Board Resolution
   - Net Worth Statements (per shareholder)
   - Shareholder Affidavits (UBO)
   - Capital Confirmations

**How to Test:**
1. Go to Stage 2
2. Add shareholders (make sure total = 100%)
3. Upload all required documents
4. Click "Next Stage"

---

### Stage 3: Director Vetting 👔
**New Features:**
1. **Simplified** - Only ID/Passport upload
2. **Progress Tracking** - Visual percentage complete
3. **Status Badges** - Verified/Pending/Rejected

**How to Test:**
1. Go to Stage 3
2. For each director, click "Upload ID"
3. Select National ID or Passport
4. Upload file (PDF/JPG/PNG)
5. Verify progress shows 100%
6. Click "Next Stage"

---

### Stage 4: Board Committees 🏛️
**New Features:**
1. **Committee Creation** - Audit, Credit, Risk, etc.
2. **Member Selection** - Multi-select from directors
3. **Chairperson Designation** - Dropdown selection
4. **TOR Upload** - Terms of Reference documents

**How to Test:**
1. Go to Stage 4
2. Click "+ Add Committee"
3. Select committee type
4. Check members (minimum 3)
5. Select chairperson
6. Save committee
7. Upload TOR document
8. Click "Next Stage"

---

### Stage 5: Product Selection 💼
**New Features:**
1. **19 Predefined Products** - Searchable catalog
2. **Category Filtering** - Loans, Bills, Lease
3. **Product Cards** - Visual browsing
4. **Custom Products** - Add your own

**How to Test:**
1. Go to Stage 5
2. Browse products by category tabs
3. Search for "personal" or "business"
4. Click "+ Add Product" on desired items
5. Fill in loan amounts, tenure, interest rate
6. Add custom product using "+ Add Other Product"
7. Click "Next Stage"

---

## 📋 Quick Testing Checklist

Before you start testing, make sure:

- [ ] PostgreSQL is running (Terminal 1)
- [ ] AI Backend is running on port 8000 (Terminal 2)
- [ ] Java Backend is running on port 8080 (Terminal 3)
- [ ] **Product catalog initialized** (Terminal 4 - ONE TIME)
- [ ] Frontend is running on port 3000 (Terminal 5)

---

## 🔍 Verify Everything is Working

### Check Backend Status:
Open browser and visit:
```
http://localhost:8080/api/products/catalog
```
✅ You should see JSON with 19 products

### Check Frontend:
```
http://localhost:3000
```
✅ You should see the RBZ application

---

## 🐛 Common Issues & Solutions

### Issue: "Product catalog is empty in Stage 5"
**Solution:** Run the initialization script:
```cmd
cd Music\RBZ_System
initialize-products.bat
```

### Issue: "Cannot upload documents"
**Solution:** 
- Ensure `uploads/` folder exists in rbz_backend
- Check file size (< 5MB)
- Check file format (PDF, JPG, PNG)

### Issue: "Directors don't show in Stage 3"
**Solution:**
- Go back to Stage 1
- Make sure you added directors
- Complete Stage 1 before proceeding

### Issue: "Cannot select chairperson in Stage 4"
**Solution:**
- You must select members FIRST
- Then the chairperson dropdown will populate

### Issue: "Compliance validation fails in Stage 2"
**Solution:**
- Make sure ownership percentages total exactly 100%
- Make sure no shareholder has > 50%

---

## 📊 Database Tables Created

The new implementation added these tables:
- `committee_member` - Committee members with roles
- `microfinance_product` - Product catalog (19 items)
- `company_product` - Company-specific products

Updated tables:
- `shareholder` - Added document path columns
- `director` - Added ID document columns  
- `board_committee` - Added chairperson columns

---

## 🎨 What You'll See in Each Stage

### Stage 2 Visual:
- Green/Red badges for compliance
- Progress bars for uploads
- Table showing all shareholders
- Real-time total calculation

### Stage 3 Visual:
- List of all directors
- Status badges (Verified ✓, Pending ⏳, Rejected ✗)
- Progress percentage at top
- Upload form for each director

### Stage 4 Visual:
- Committee table with chairperson highlighted 🪑
- Modal popup for creating committees
- TOR upload buttons
- Member list for each committee

### Stage 5 Visual:
- Product cards organized by tabs
- Search bar with real-time filtering
- Selected products table at top
- Badge showing count "X Product(s) Selected"

---

## 🎯 Testing Flow

**Complete Testing Path:**
1. Start all services (5 terminals)
2. Initialize product catalog (one time)
3. Stage 1: Enter company details
4. Stage 2: Add 3-5 shareholders, upload docs
5. Stage 3: Upload ID for all directors
6. Stage 4: Create 2-3 committees
7. Stage 5: Select 5+ products
8. Continue through remaining stages
9. Generate report

---

## 📸 Screenshots to Take

For documentation:
1. Stage 2 - Shareholding table with compliance check
2. Stage 3 - Director vetting with 100% progress
3. Stage 4 - Committee table with chairperson
4. Stage 5 - Product catalog and selected products

---

## ✅ Success Indicators

**You'll know it's working when:**

✅ **Stage 2:**
- Compliance shows green checkmark
- All documents upload successfully
- Total ownership shows 100% in green badge

✅ **Stage 3:**
- Progress bar shows 100%
- All directors show "Verified" status
- Next button becomes enabled

✅ **Stage 4:**
- Committees appear in table
- Chairperson shows with 🪑 icon
- TOR shows "✓ Uploaded"

✅ **Stage 5:**
- Products display in catalog
- Search returns results
- Selected products table updates
- Badge count increases

---

## 🚀 Ready to Test!

All components are built and ready. Just follow the startup procedure above, initialize the product catalog, and start testing!

**Good luck! 🎉**
