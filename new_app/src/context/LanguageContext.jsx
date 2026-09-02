import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

const LanguageContext = createContext();

export const LANGUAGES = [
    { code: 'en', name: 'English', native: 'English', region: 'All India', flag: '🇬🇧' },
    { code: 'hi', name: 'Hindi', native: 'हिन्दी', region: 'North & Central India', flag: '🇮🇳' },
    { code: 'te', name: 'Telugu', native: 'తెలుగు', region: 'Telangana & Andhra Pradesh', flag: '🌾' },
    { code: 'ta', name: 'Tamil', native: 'தமிழ்', region: 'Tamil Nadu & Puducherry', flag: '🌴' },
    { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ', region: 'Karnataka', flag: '🌱' },
    { code: 'ml', name: 'Malayalam', native: 'മലയാളം', region: 'Kerala', flag: '🥥' },
    { code: 'mr', name: 'Marathi', native: 'मराठी', region: 'Maharashtra', flag: '🚩' },
    { code: 'gu', name: 'Gujarati', native: 'ગુજરાતી', region: 'Gujarat', flag: '🌻' },
    { code: 'bn', name: 'Bengali', native: 'বাংলা', region: 'West Bengal & Tripura', flag: '🐟' },
    { code: 'pa', name: 'Punjabi', native: 'ਪੰਜਾਬੀ', region: 'Punjab & Haryana', flag: '🚜' },
    { code: 'or', name: 'Odia', native: 'ଓଡ଼ିଆ', region: 'Odisha', flag: '🌊' },
    { code: 'as', name: 'Assamese', native: 'অসমীয়া', region: 'Assam & Northeast', flag: '🌿' },
    { code: 'ur', name: 'Urdu', native: 'اردو', region: 'National', flag: '📜' },
    { code: 'sa', name: 'Sanskrit', native: 'संस्कृतम्', region: 'Classical', flag: '🕉️' },
    { code: 'mai', name: 'Maithili', native: 'मैथिली', region: 'Bihar & Jharkhand', flag: '🌾' },
    { code: 'bho', name: 'Bhojpuri', native: 'भोजपुरी', region: 'UP & Bihar', flag: '🌽' },
    { code: 'ne', name: 'Nepali', native: 'नेपाली', region: 'Sikkim & West Bengal', flag: '🏔️' },
    { code: 'gom', name: 'Konkani', native: 'कोंकणी', region: 'Goa & Coastal Karnataka', flag: '🏖️' },
    { code: 'sd', name: 'Sindhi', native: 'سنڌي', region: 'National', flag: '🏺' },
    { code: 'doi', name: 'Dogri', native: 'डोगरी', region: 'Jammu & Kashmir', flag: '🍎' }
];

export const TRANSLATIONS = {
    en: {
        // App Core
        appName: 'KisanConnect',
        tagline: 'Unified Agricultural Ecosystem',
        taglineDesc: 'Empowering Indian farmers, mill operators, and transport fleets with QR-verified intake, live pricing, and transparent digital logistics.',
        
        // Roles & Portals
        farmerPortal: 'Farmer Portal',
        farmerPortalSubtitle: 'Empower Your Yield',
        farmerPortalDesc: 'Real-time weather, market rates, direct mill enquiries, QR gate pass, and instant direct bank payments.',
        millPortal: 'Mills',
        millPortalSubtitle: 'Grain Procurement',
        millPortalDesc: 'Weighbridge intake, automated quintal conversions, direct farmer bank payouts, and gate QR scans.',
        transportPortal: 'Transport Provider',
        transportPortalSubtitle: 'Smart Agro-Logistics',
        transportPortalDesc: 'Smart truck capacity matching, haulage bids, trip progress, and freight payouts.',
        enterPortal: 'Enter Portal',
        
        // Navigation
        dashboard: 'Dashboard',
        crops: 'My Crops',
        myCrops: 'My Crops',
        mills: 'Nearby Mills',
        nearbyMills: 'Nearby Mills',
        enquiries: 'My Enquiries',
        myEnquiries: 'My Enquiries',
        qrcodes: 'My QR Codes',
        myQrCodes: 'My QR Codes',
        payments: 'Payments',
        loadstatus: 'Load Status',
        transport: 'Transport',
        history: 'History & Ledger',
        market: 'Market Prices',
        profile: 'Profile',
        profileSettings: 'Profile & Settings',
        logout: 'Logout',
        
        // Farmer Dashboard
        goodDay: 'Good Day',
        welcomeSub: 'Connected directly to mills, transparent grain discovery, and instant QR verification.',
        addNewCrop: 'Add New Crop',
        activeCrops: 'Active Crops',
        sentEnquiries: 'Sent Enquiries',
        verificationQrs: 'Verification QRs',
        directPayments: 'Direct Payments',
        settlementsReceived: 'Settlements Received',
        readyForDelivery: 'Scan-ready for delivery',
        viewQr: 'View QR',
        viewVerificationQr: 'View Verification QR',
        searchPlaceholder: 'Search crops, prices, enquiries...',
        
        // Crops Tab
        registeredHarvest: 'Registered Harvest & Crop Lots',
        cropVariety: 'Crop Variety',
        acres: 'Acres',
        estimatedYield: 'Estimated Yield',
        harvestDate: 'Harvest Date',
        farmLocation: 'Farm Location',
        actions: 'Actions',
        deleteCrop: 'Delete Crop',
        findNearbyMills: 'Find Mills',
        noCropsFound: 'No crops added yet. Add your first crop above!',
        
        // Mills Tab
        verifiedMillsTitle: 'Verified Processing Mills & Live Rates',
        comparePrices: 'Compare APMC mandi rates with verified mill direct purchasing prices',
        highestOffer: 'Highest Offer',
        perQuintal: 'per Quintal',
        sendEnquiry: 'Send Enquiry',
        capacity: 'Daily Capacity',
        distance: 'Distance',
        contactMill: 'Contact Mill',
        noMillsFound: 'No mills currently found in your radius.',
        
        // Enquiries Tab
        produceEnquiriesTitle: 'My Produce Enquiries & Price Negotiation',
        filterAll: 'All',
        filterPending: 'Pending',
        filterAccepted: 'Accepted',
        filterRejected: 'Rejected',
        offeredRate: 'Offered Rate',
        agreedPrice: 'Agreed Price',
        transportRequired: 'Transport Required',
        pickupDate: 'Pickup Date',
        weighedQuantity: 'Weighed Quantity',
        paymentStatus: 'Payment Status',
        
        // Payments & Settlements
        paymentsTitle: 'Direct Mill Payments & Settlements',
        paymentsSubtitle: 'Transparent weighbridge quantities, quintal rate conversions, and direct bank payouts from mills',
        updateBankAccount: 'Update Bank Account',
        totalPaymentsReceived: 'Total Payments Received',
        completedTransfers: 'completed mill transfers',
        pendingSettlements: 'Pending Settlements',
        awaitingMillPayment: 'loads awaiting mill payment',
        totalWeighedProduce: 'Total Weighed Produce',
        deliveredQuintals: 'Quintals delivered',
        registeredBankTitle: 'My Registered Bank Account for Mill Direct Payouts',
        verifiedForTransfer: 'Verified for Direct Transfer',
        accountHolder: 'Account Holder Name',
        bankName: 'Bank Name',
        accountNumber: 'Account Number',
        ifscCode: 'IFSC Code',
        upiId: 'UPI ID',
        allTransactions: 'All Transactions',
        paymentCompleted: 'Payment Completed',
        paymentPending: 'Payment Pending',
        awaitingMill: 'AWAITING MILL',
        enquiryRef: 'Enquiry Ref',
        purchaserMill: 'Purchaser Mill',
        cropAndQuantity: 'Crop & Quantity',
        pricePerQuintal: 'Price / Quintal',
        totalAmount: 'Total Amount',
        status: 'Status',
        paymentDate: 'Payment Date',
        receipt: 'Receipt',
        viewBill: 'View Bill',
        viewSlip: 'View Slip',
        close: 'Close',
        print: 'Print',
        saveBankDetails: 'Save Bank Details',
        tonnes: 'Tonnes',
        quintals: 'Quintals',
        shareWhatsApp: 'Share via WhatsApp',
        
        // Profile & Preferences
        profileTitle: 'Farmer Profile & Settings',
        generalTab: 'General Details',
        farmPersonalTab: 'Farm & Personal Info',
        payoutTab: 'Direct Payout & Bank',
        securityTab: 'Security PIN',
        preferencesTab: 'Preferences & Language',
        preferredLanguage: 'Preferred Language',
        languageSettingDesc: 'Select your regional language for dashboard labels, crop information, and notifications.',
        savePreferences: 'Save Preferences',
        savedSuccess: 'Language preference saved successfully!',
        fullName: 'Full Name',
        primaryPhone: 'Primary Phone (Registered)',
        altPhone: 'WhatsApp / Alternate Phone',
        village: 'Village / Gram Panchayat',
        districtState: 'District & State',
        farmingPractice: 'Primary Farming Practice',
        saveProfileChanges: 'Save Profile Changes',
        totalLandHolding: 'Total Land Holding',
        registeredCrops: 'Registered Crops',
        millEnquiries: 'Mill Enquiries',
        kycStatus: 'KYC Status',
        verifiedFarmer: 'Verified Farmer',
        dailyMandiAlerts: 'Daily Mandi Price Alerts',
        loadDispatchSms: 'Load Dispatch & Arrival SMS',
        extremeWeatherAlerts: 'Extreme Weather Advisories',
        
        // Mill Buyer Portal
        paymentsAndLoads: 'Payments & Loads',
        loadsPendingBadge: 'Pending',
        confirmLoadReceived: 'Confirm Load Received',
        actualTonnesReceived: 'Actual Tonnes Received (Weighbridge)',
        convertedQuintals: 'Converted Quintals (1T = 10 Qtl)',
        automatedCalculation: 'Automated Bill Calculation',
        totalPayableAmount: 'Total Payable Amount',
        makePayment: 'Make Payment',
        farmerBankDetailsTitle: 'Farmer Bank Details (For Transfer)',
        copyAccount: 'Copy Account Number',
        copyIfsc: 'Copy IFSC Code',
        copyUpi: 'Copy UPI',
        paymentMethod: 'Payment Method',
        utrReference: 'Transaction / UTR Reference No.',
        confirmPaymentCompleted: 'Payment Completed',
        produceIntakeReceipt: 'Produce Intake Payment Receipt',
        scanFarmerQr: 'Scan Gate QR',
        
        // Common Buttons & Badges
        save: 'Save',
        cancel: 'Cancel',
        confirm: 'Confirm',
        delete: 'Delete',
        edit: 'Edit',
        active: 'Active',
        pending: 'Pending',
        completed: 'Completed',
        paid: 'Paid',
        yes: 'Yes',
        no: 'No',
        back: 'Back',
        footerCopyright: '© 2026 KisanConnect Ecosystem'
    },

    te: {
        // App Core (తెలుగు)
        appName: 'కిసాన్ కనెక్ట్',
        tagline: 'సమగ్ర వ్యవసాయ డిజిటల్ వ్యవస్థ',
        taglineDesc: 'రైతులు, మిల్లు యజమానులు మరియు రవాణాదారులను క్యూఆర్ తూకం, ప్రత్యక్ష ధరలు మరియు డిజిటల్ చెల్లింపులతో అనుసంధానించడం.',
        
        // Roles & Portals
        farmerPortal: 'రైతు పోర్టల్',
        farmerPortalSubtitle: 'మీ దిగుబడికి నిజమైన విలువ',
        farmerPortalDesc: 'వాతావరణ వివరాలు, మార్కెట్ ధరలు, మిల్లు విచారణలు, క్యూఆర్ గేట్ పాస్ మరియు బ్యాంక్ ఖాతాకు నేరుగా చెల్లింపులు.',
        millPortal: 'రైస్ & దాల్ మిల్లులు',
        millPortalSubtitle: 'ధాన్య సేకరణ & ప్రాసెసింగ్',
        millPortalDesc: 'వేబ్రిడ్జి తూకం, ఆటోమేటిక్ క్వింటాళ్ల బిల్లు, రైతులకు నేరుగా బ్యాంక్ చెల్లింపులు మరియు క్యూఆర్ స్కానింగ్.',
        transportPortal: 'రవాణా సేవలు',
        transportPortalSubtitle: 'స్మార్ట్ వ్యవసాయ రవాణా',
        transportPortalDesc: 'ట్రక్ కెపాసిటీ మ్యాచింగ్, రవాణా ధరలు, ట్రిప్ ట్రాకింగ్ మరియు తక్షణ కిరాయి చెల్లింపులు.',
        enterPortal: 'పోర్టల్‌లోకి ప్రవేశించండి',
        
        // Navigation
        dashboard: 'డ్యాష్‌బోర్డ్',
        crops: 'నా పంటలు',
        myCrops: 'నా పంటలు',
        mills: 'సమీప మిల్లులు',
        nearbyMills: 'సమీప మిల్లులు',
        enquiries: 'నా విచారణలు',
        myEnquiries: 'నా విచారణలు',
        qrcodes: 'నా క్యూఆర్ కోడ్‌లు',
        myQrCodes: 'నా క్యూఆర్ కోడ్‌లు',
        payments: 'చెల్లింపులు',
        loadstatus: 'లోడ్ స్థితి',
        transport: 'రవాణా',
        history: 'చరిత్ర & లెడ్జర్',
        market: 'మార్కెట్ ధరలు',
        profile: 'ప్రొఫైల్',
        profileSettings: 'ప్రొఫైల్ & సెట్టింగ్‌లు',
        logout: 'లాగ్ అవుట్',
        
        // Farmer Dashboard
        goodDay: 'నమస్కారం',
        welcomeSub: 'మిల్లులతో నేరుగా అనుసంధానం, పారదర్శక ధరలు మరియు తక్షణ క్యూఆర్ ధృవీకరణ.',
        addNewCrop: 'కొత్త పంట జోడించండి',
        activeCrops: 'క్రియాశీల పంటలు',
        sentEnquiries: 'పంపిన విచారణలు',
        verificationQrs: 'ధృవీకరణ క్యూఆర్',
        directPayments: 'ప్రత్యక్ష చెల్లింపులు',
        settlementsReceived: 'అందిన చెల్లింపులు',
        readyForDelivery: 'రవాణాకు సిద్ధంగా ఉంది',
        viewQr: 'క్యూఆర్ చూడండి',
        viewVerificationQr: 'ధృవీకరణ క్యూఆర్ చూడండి',
        searchPlaceholder: 'పంటలు, ధరలు, విచారణలు వెతకండి...',
        
        // Crops Tab
        registeredHarvest: 'నమోదిత పంటలు & దిగుబడి లాట్లు',
        cropVariety: 'పంట రకం',
        acres: 'ఎకరాలు',
        estimatedYield: 'అంచనా దిగుబడి (టన్నులు)',
        harvestDate: 'కోత తేదీ',
        farmLocation: 'పొలం ఉన్న ప్రాంతం',
        actions: 'చర్యలు',
        deleteCrop: 'పంటను తొలగించు',
        findNearbyMills: 'మిల్లులను కనుగొనండి',
        noCropsFound: 'ఇంకా పంటలు నమోదు చేయలేదు. పైన ఉన్న బటన్ నొక్కి జోడించండి!',
        
        // Mills Tab
        verifiedMillsTitle: 'ధృవీకరించబడిన మిల్లులు & ప్రత్యక్ష ధరలు',
        comparePrices: 'వ్యవసాయ మార్కెట్ (APMC) ధరలతో మిల్లు కొనుగోలు ధరలను సరిపోల్చండి',
        highestOffer: 'గరిష్ట ధర ఆఫర్',
        perQuintal: 'క్వింటాకు',
        sendEnquiry: 'విచారణ పంపండి',
        capacity: 'రోజువారీ సామర్థ్యం',
        distance: 'దూరం',
        contactMill: 'మిల్లును సంప్రదించండి',
        noMillsFound: 'మీ సమీపంలో ప్రస్తుతం మిల్లులు అందుబాటులో లేవు.',
        
        // Enquiries Tab
        produceEnquiriesTitle: 'నా పంట విచారణలు & ధరల సంప్రదింపులు',
        filterAll: 'అన్నీ',
        filterPending: 'పెండింగ్',
        filterAccepted: 'అంగీకరించినవి',
        filterRejected: 'తిరస్కరించినవి',
        offeredRate: 'ఆఫర్ చేసిన ధర',
        agreedPrice: 'ఖరారైన ధర',
        transportRequired: 'రవాణా అవసరమా',
        pickupDate: 'లోడింగ్ తేదీ',
        weighedQuantity: 'తూకం వేసిన పరిమాణం',
        paymentStatus: 'చెల్లింపు స్థితి',
        
        // Payments & Settlements
        paymentsTitle: 'మిల్లు ప్రత్యక్ష చెల్లింపులు & సెటిల్‌మెంట్లు',
        paymentsSubtitle: 'వేబ్రిడ్జి ఖచ్చితమైన తూకం, క్వింటా లెక్కలు మరియు బ్యాంకుకు నేరుగా బదిలీ',
        updateBankAccount: 'బ్యాంక్ ఖాతా నవీకరణ',
        totalPaymentsReceived: 'మొత్తం అందిన చెల్లింపులు',
        completedTransfers: 'పూర్తయిన మిల్లు బదిలీలు',
        pendingSettlements: 'పెండింగ్ చెల్లింపులు',
        awaitingMillPayment: 'చెల్లింపు కోసం వేచి ఉన్న లోడ్లు',
        totalWeighedProduce: 'మొత్తం తూకం వేసిన పంట',
        deliveredQuintals: 'డెలివరీ చేసిన క్వింటాళ్లు',
        registeredBankTitle: 'మిల్లుల నుండి నేరుగా చెల్లింపుల కోసం నమోదిత బ్యాంక్ ఖాతా',
        verifiedForTransfer: 'ప్రత్యక్ష బదిలీకి ధృవీకరించబడింది',
        accountHolder: 'ఖాతాదారుని పేరు',
        bankName: 'బ్యాంక్ పేరు',
        accountNumber: 'ఖాతా సంఖ్య',
        ifscCode: 'ఐఎఫ్‌ఎస్‌సి (IFSC) కోడ్',
        upiId: 'యుపిఐ (UPI) ఐడీ',
        allTransactions: 'అన్ని లావాదేవీలు',
        paymentCompleted: 'చెల్లింపు పూర్తయింది',
        paymentPending: 'చెల్లింపు పెండింగ్',
        awaitingMill: 'మిల్లు చెల్లింపు పెండింగ్',
        enquiryRef: 'విచారణ సంఖ్య',
        purchaserMill: 'కొనుగోలు మిల్లు',
        cropAndQuantity: 'పంట & పరిమాణం',
        pricePerQuintal: 'క్వింటా ధర',
        totalAmount: 'మొత్తం సొమ్ము',
        status: 'స్థితి',
        paymentDate: 'చెల్లింపు తేదీ',
        receipt: 'రసీదు',
        viewBill: 'బిల్లు చూడండి',
        viewSlip: 'స్లిప్ చూడండి',
        close: 'మూసివేయి',
        print: 'ప్రింట్',
        saveBankDetails: 'బ్యాంక్ వివరాలు భద్రపరచండి',
        tonnes: 'టన్నులు',
        quintals: 'క్వింటాళ్లు',
        shareWhatsApp: 'వాట్సాప్‌లో షేర్ చేయండి',
        
        // Profile & Preferences
        profileTitle: 'రైతు ప్రొఫైల్ & సెట్టింగ్‌లు',
        generalTab: 'సాధారణ వివరాలు',
        farmPersonalTab: 'వ్యవసాయ & వ్యక్తిగత సమాచారం',
        payoutTab: 'బ్యాంక్ వివరాలు & చెల్లింపులు',
        securityTab: 'సెక్యూరిటీ పిన్ (PIN)',
        preferencesTab: 'ప్రాధాన్యతలు & భాష',
        preferredLanguage: 'ఇష్టపడే ప్రాంతీయ భాష',
        languageSettingDesc: 'డ్యాష్‌బోర్డ్, పంట వివరాలు మరియు నోటిఫికేషన్‌ల కోసం మీ స్థానిక భాషను ఎంచుకోండి.',
        savePreferences: 'ప్రాధాన్యతలు భద్రపరచండి',
        savedSuccess: 'భాష విజయవంతంగా మార్చబడింది!',
        fullName: 'పూర్తి పేరు',
        primaryPhone: 'నమోదిత ప్రాథమిక ఫోన్',
        altPhone: 'వాట్సాప్ / ప్రత్యామ్నాయ ఫోన్',
        village: 'గ్రామం / గ్రామ పంచాయితీ',
        districtState: 'జిల్లా & రాష్ట్రం',
        farmingPractice: 'ప్రధాన వ్యవసాయ పద్ధతి',
        saveProfileChanges: 'ప్రొఫైల్ మార్పులు భద్రపరచండి',
        totalLandHolding: 'మొత్తం సాగు భూమి',
        registeredCrops: 'నమోదిత పంటలు',
        millEnquiries: 'మిల్లు విచారణలు',
        kycStatus: 'కేవైసీ (KYC) స్థితి',
        verifiedFarmer: 'ధృవీకరించబడిన రైతు',
        dailyMandiAlerts: 'రోజువారీ మార్కెట్ ధరల హెచ్చరికలు',
        loadDispatchSms: 'రవాణా బయలుదేరడం & చేరడంపై SMS',
        extremeWeatherAlerts: 'వాతావరణ మార్పుల ముందస్తు హెచ్చరికలు',
        
        // Mill Buyer Portal
        paymentsAndLoads: 'చెల్లింపులు & లోడ్లు',
        loadsPendingBadge: 'పెండింగ్',
        confirmLoadReceived: 'లోడ్ రసీదును నిర్ధారించండి',
        actualTonnesReceived: 'వేబ్రిడ్జి వాస్తవ టన్నుల తూకం',
        convertedQuintals: 'మార్చిన క్వింటాళ్లు (1 టన్ను = 10 క్వింటాళ్లు)',
        automatedCalculation: 'ఆటోమేటిక్ బిల్లు లెక్కింపు',
        totalPayableAmount: 'చెల్లించవలసిన మొత్తం',
        makePayment: 'చెల్లింపు చేయండి',
        farmerBankDetailsTitle: 'రైతు బ్యాంక్ వివరాలు (బదిలీ కోసం)',
        copyAccount: 'ఖాతా సంఖ్య కాపీ',
        copyIfsc: 'IFSC కోడ్ కాపీ',
        copyUpi: 'UPI కాపీ',
        paymentMethod: 'చెల్లింపు విధానం',
        utrReference: 'లావాదేవీ / UTR రిఫరెన్స్ సంఖ్య',
        confirmPaymentCompleted: 'చెల్లింపు పూర్తయింది',
        produceIntakeReceipt: 'పంట కొనుగోలు చెల్లింపు రసీదు',
        scanFarmerQr: 'గేట్ క్యూఆర్ స్కాన్ చేయండి',
        
        // Common
        save: 'భద్రపరచు',
        cancel: 'రద్దు చేయి',
        confirm: 'నిర్ధారించు',
        delete: 'తొలగించు',
        edit: 'సవరించు',
        active: 'క్రియాశీలం',
        pending: 'పెండింగ్',
        completed: 'పూర్తయింది',
        paid: 'చెల్లించబడింది',
        yes: 'అవును',
        no: 'కాదు',
        back: 'వెనుకకు',
        footerCopyright: '© 2026 కిసాన్ కనెక్ట్ ఎకోసిస్టమ్'
    },

    hi: {
        // App Core (हिन्दी)
        appName: 'किसान कनेक्ट',
        tagline: 'एकीकृत कृषि डिजिटल मंच',
        taglineDesc: 'किसानों, मिल मालिकों और ट्रांसपोर्टरों को डिजिटल तौल, पारदर्शी भाव और त्वरित बैंक भुगतान से जोड़ना।',
        
        // Roles & Portals
        farmerPortal: 'किसान पोर्टल',
        farmerPortalSubtitle: 'अपनी उपज का सही मूल्य पाएं',
        farmerPortalDesc: 'मौसम, मंडी भाव, सीधे मिल सौदे, क्यूआर गेट पास और बैंक खाते में त्वरित प्रत्यक्ष भुगतान।',
        millPortal: 'मिल एवं खरीददार',
        millPortalSubtitle: 'अनाज खरीद एवं प्रसंस्करण',
        millPortalDesc: 'वेब्रिज तौल, स्वचालित क्विंटल बिल, सीधे बैंक ट्रांसफर और क्यूआर स्कैन।',
        transportPortal: 'परिवहन सेवा',
        transportPortalSubtitle: 'स्मार्ट कृषि लॉजिस्टिक्स',
        transportPortalDesc: 'स्मार्ट ट्रक क्षमता मिलान, भाड़ा बोली, लाइव ट्रैकिंग और त्वरित मालभाड़ा भुगतान।',
        enterPortal: 'पोर्टल में प्रवेश करें',
        
        // Navigation
        dashboard: 'डैशबोर्ड',
        crops: 'मेरी फसलें',
        myCrops: 'मेरी फसलें',
        mills: 'नजदीकी मिलें',
        nearbyMills: 'नजदीकी मिलें',
        enquiries: 'मेरी पूछताछ',
        myEnquiries: 'मेरी पूछताछ',
        qrcodes: 'मेरे क्यूआर कोड',
        myQrCodes: 'मेरे क्यूआर कोड',
        payments: 'भुगतान',
        loadstatus: 'लोड स्थिति',
        transport: 'परिवहन',
        history: 'इतिहास और लेज़र',
        market: 'मंडी भाव',
        profile: 'प्रोफ़ाइल',
        profileSettings: 'प्रोफ़ाइल और सेटिंग्स',
        logout: 'लॉग आउट',
        
        // Farmer Dashboard
        goodDay: 'नमस्ते',
        welcomeSub: 'मिलों से सीधा संपर्क, पारदर्शी अनाज भाव और त्वरित डिजिटल सत्यापन।',
        addNewCrop: 'नई फसल जोड़ें',
        activeCrops: 'सक्रिय फसलें',
        sentEnquiries: 'भेजी गई पूछताछ',
        verificationQrs: 'सत्यापन क्यूआर',
        directPayments: 'सीधा भुगतान',
        settlementsReceived: 'प्राप्त भुगतान',
        readyForDelivery: 'डिलीवरी के लिए तैयार',
        viewQr: 'क्यूआर देखें',
        viewVerificationQr: 'सत्यापन क्यूआर देखें',
        searchPlaceholder: 'फसलें, भाव, पूछताछ खोजें...',
        
        // Crops Tab
        registeredHarvest: 'पंजीकृत फसलें और लॉट',
        cropVariety: 'फसल की किस्म',
        acres: 'एकड़',
        estimatedYield: 'अनुमानित उपज (टन)',
        harvestDate: 'कटाई तिथि',
        farmLocation: 'खेत का स्थान',
        actions: 'कार्रवाई',
        deleteCrop: 'फसल हटाएं',
        findNearbyMills: 'मिलें खोजें',
        noCropsFound: 'अभी तक कोई फसल नहीं जोड़ी गई। कृपया ऊपर नई फसल जोड़ें!',
        
        // Mills Tab
        verifiedMillsTitle: 'सत्यापित मिलें और लाइव भाव',
        comparePrices: 'मंडी भाव (APMC) के साथ मिलों के खरीद भाव की तुलना करें',
        highestOffer: 'सर्वोत्तम भाव',
        perQuintal: 'प्रति क्विंटल',
        sendEnquiry: 'पूछताछ भेजें',
        capacity: 'दैनिक क्षमता',
        distance: 'दूरी',
        contactMill: 'मिल से संपर्क करें',
        noMillsFound: 'आपके क्षेत्र में अभी कोई मिल उपलब्ध नहीं है।',
        
        // Enquiries Tab
        produceEnquiriesTitle: 'मेरी फसल पूछताछ और भाव बातचीत',
        filterAll: 'सभी',
        filterPending: 'लंबित',
        filterAccepted: 'स्वीकृत',
        filterRejected: 'अस्वीकृत',
        offeredRate: 'प्रस्तावित भाव',
        agreedPrice: 'सहमति भाव',
        transportRequired: 'परिवहन की आवश्यकता',
        pickupDate: 'लोडिंग तिथि',
        weighedQuantity: 'तौली गई मात्रा',
        paymentStatus: 'भुगतान स्थिति',
        
        // Payments & Settlements
        paymentsTitle: 'मिल प्रत्यक्ष भुगतान और निपटान',
        paymentsSubtitle: 'वेब्रिज पर सही वजन, स्वचालित क्विंटल गणना और बैंक खाते में सीधा भुगतान',
        updateBankAccount: 'बैंक खाता बदलें',
        totalPaymentsReceived: 'कुल प्राप्त भुगतान',
        completedTransfers: 'सफल बैंक ट्रांसफर',
        pendingSettlements: 'लंबित भुगतान',
        awaitingMillPayment: 'भुगतान के लिए प्रतीक्षारत लोड',
        totalWeighedProduce: 'कुल तौला गया माल',
        deliveredQuintals: 'डिलीवर किए गए क्विंटल',
        registeredBankTitle: 'मिल से सीधे भुगतान के लिए पंजीकृत बैंक खाता',
        verifiedForTransfer: 'प्रत्यक्ष ट्रांसफर के लिए सत्यापित',
        accountHolder: 'खाताधारक का नाम',
        bankName: 'बैंक का नाम',
        accountNumber: 'खाता संख्या',
        ifscCode: 'आईएफएससी (IFSC) कोड',
        upiId: 'यूपीआई (UPI) आईडी',
        allTransactions: 'सभी लेन-देन',
        paymentCompleted: 'भुगतान पूर्ण',
        paymentPending: 'भुगतान लंबित',
        awaitingMill: 'मिल भुगतान प्रतीक्षारत',
        enquiryRef: 'पूछताछ संदर्भ',
        purchaserMill: 'खरीदार मिल',
        cropAndQuantity: 'फसल और मात्रा',
        pricePerQuintal: 'भाव प्रति क्विंटल',
        totalAmount: 'कुल राशि',
        status: 'स्थिति',
        paymentDate: 'भुगतान तिथि',
        receipt: 'रसीद',
        viewBill: 'बिल देखें',
        viewSlip: 'पर्ची देखें',
        close: 'बंद करें',
        print: 'प्रिंट करें',
        saveBankDetails: 'बैंक विवरण सहेजें',
        tonnes: 'टन',
        quintals: 'क्विंटल',
        shareWhatsApp: 'व्हाट्सएप पर साझा करें',
        
        // Profile & Preferences
        profileTitle: 'किसान प्रोफ़ाइल और सेटिंग्स',
        generalTab: 'सामान्य विवरण',
        farmPersonalTab: 'कृषि एवं व्यक्तिगत विवरण',
        payoutTab: 'बैंक विवरण और भुगतान',
        securityTab: 'सुरक्षा पिन (PIN)',
        preferencesTab: 'प्राथमिकताएं और भाषा',
        preferredLanguage: 'पसंदीदा क्षेत्रीय भाषा',
        languageSettingDesc: 'डैशबोर्ड और अलर्ट्स के लिए अपनी क्षेत्रीय भाषा चुनें।',
        savePreferences: 'प्राथमिकताएं सहेजें',
        savedSuccess: 'भाषा प्राथमिकता सफलतापूर्वक अपडेट हो गई!',
        fullName: 'पूरा नाम',
        primaryPhone: 'पंजीकृत प्राथमिक फोन',
        altPhone: 'व्हाट्सएप / वैकल्पिक फोन',
        village: 'गाँव / ग्राम पंचायत',
        districtState: 'जिला और राज्य',
        farmingPractice: 'मुख्य कृषि पद्धति',
        saveProfileChanges: 'विवरण सहेजें',
        totalLandHolding: 'कुल जोत भूमि',
        registeredCrops: 'पंजीकृत फसलें',
        millEnquiries: 'मिल पूछताछ',
        kycStatus: 'केवाईसी (KYC) स्थिति',
        verifiedFarmer: 'सत्यापित किसान',
        dailyMandiAlerts: 'दैनिक मंडी भाव अलर्ट',
        loadDispatchSms: 'गाड़ी रवानगी एवं आगमन एसएमएस',
        extremeWeatherAlerts: 'खराब मौसम पूर्व चेतावनी',
        
        // Mill Buyer Portal
        paymentsAndLoads: 'भुगतान और लोड',
        loadsPendingBadge: 'लंबित',
        confirmLoadReceived: 'लोड प्राप्ति की पुष्टि करें',
        actualTonnesReceived: 'वेब्रिज वास्तविक वजन (टन)',
        convertedQuintals: 'क्विंटल में परिवर्तन (1 टन = 10 क्विंटल)',
        automatedCalculation: 'स्वचालित बिल गणना',
        totalPayableAmount: 'कुल देय राशि',
        makePayment: 'भुगतान करें',
        farmerBankDetailsTitle: 'किसान बैंक विवरण (ट्रांसफर हेतु)',
        copyAccount: 'खाता संख्या कॉपी करें',
        copyIfsc: 'IFSC कोड कॉपी करें',
        copyUpi: 'UPI आईडी कॉपी करें',
        paymentMethod: 'भुगतान का तरीका',
        utrReference: 'लेन-देन / UTR संदर्भ संख्या',
        confirmPaymentCompleted: 'भुगतान पूर्ण हुआ',
        produceIntakeReceipt: 'अनाज आवक भुगतान रसीद',
        scanFarmerQr: 'गेट क्यूआर स्कैन करें',
        
        // Common
        save: 'सहेजें',
        cancel: 'रद्द करें',
        confirm: 'पुष्टि करें',
        delete: 'हटाएं',
        edit: 'संपादित करें',
        active: 'सक्रिय',
        pending: 'लंबित',
        completed: 'पूर्ण',
        paid: 'भुगतान किया गया',
        yes: 'हाँ',
        no: 'नहीं',
        back: 'पीछे जाएं',
        footerCopyright: '© 2026 किसान कनेक्ट इकोसिस्टम'
    },

    kn: {
        // App Core (ಕನ್ನಡ)
        appName: 'ಕಿಸಾನ್ ಕನೆಕ್ಟ್',
        tagline: 'ಸಮಗ್ರ ಕೃಷಿ ಡಿಜಿಟಲ್ ವೇದಿಕೆ',
        taglineDesc: 'ರೈತರು, ಗಿರಣಿ ಮಾಲೀಕರು ಮತ್ತು ಸಾರಿಗೆದಾರರನ್ನು ಡಿಜಿಟಲ್ ತೂಕ ಮತ್ತು ನೇರ ಬ್ಯಾಂಕ್ ಪಾವತಿಗಳೊಂದಿಗೆ ಸಂಪರ್ಕಿಸುವುದು.',
        farmerPortal: 'ರೈತ ಪೋರ್ಟಲ್',
        farmerPortalSubtitle: 'ನಿಮ್ಮ ಬೆಳೆಗೆ ಉತ್ತಮ ಮೌಲ್ಯ',
        farmerPortalDesc: 'ಹವಾಮಾನ, ಮಾರುಕಟ್ಟೆ ದರಗಳು, ನೇರ ಗಿರಣಿ ವಿಚಾರಣೆಗಳು ಮತ್ತು ನೇರ ಬ್ಯಾಂಕ್ ಪಾವತಿಗಳು.',
        millPortal: 'ಗಿರಣಿಗಳು & ಖರೀದಿದಾರರು',
        millPortalSubtitle: 'ಧಾನ್ಯ ಖರೀದಿ & ಸಂಸ್ಕರಣೆ',
        millPortalDesc: 'ವೇಬ್ರಿಡ್ಜ್ ತೂಕ, ಕ್ವಿಂಟಾಲ್ ಲೆಕ್ಕಾಚಾರ, ನೇರ ಪಾವತಿಗಳು ಮತ್ತು ಕ್ಯೂಆರ್ ಸ್ಕ್ಯಾನ್.',
        transportPortal: 'ಸಾರಿಗೆ ಸೇವೆಗಳು',
        transportPortalSubtitle: 'ಸ್ಮಾರ್ಟ್ ಕೃಷಿ ಸಾರಿಗೆ',
        transportPortalDesc: 'ಸ್ಮಾರ್ಟ್ ಟ್ರಕ್ ಸಾಮರ್ಥ್ಯ ಹೊಂದಾಣಿಕೆ ಮತ್ತು ಲೈವ್ ಟ್ರ್ಯಾಕಿಂಗ್.',
        enterPortal: 'ಪ್ರವೇಶಿಸಿ',
        dashboard: 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್',
        crops: 'ನನ್ನ ಬೆಳೆಗಳು',
        myCrops: 'ನನ್ನ ಬೆಳೆಗಳು',
        mills: 'ಹತ್ತಿರದ ಗಿರಣಿಗಳು',
        nearbyMills: 'ಹತ್ತಿರದ ಗಿರಣಿಗಳು',
        enquiries: 'ನನ್ನ ವಿಚಾರಣೆಗಳು',
        myEnquiries: 'ನನ್ನ ವಿಚಾರಣೆಗಳು',
        qrcodes: 'ನನ್ನ ಕ್ಯೂಆರ್ ಕೋಡ್‌ಗಳು',
        myQrCodes: 'ನನ್ನ ಕ್ಯೂಆರ್ ಕೋಡ್‌ಗಳು',
        payments: 'ಪಾವತಿಗಳು',
        loadstatus: 'ಲೋಡ್ ಸ್ಥಿತಿ',
        transport: 'ಸಾರಿಗೆ',
        history: 'ಇತಿಹಾಸ & ಲೆಡ್ಜರ್',
        market: 'ಮಾರುಕಟ್ಟೆ ಬೆಲೆಗಳು',
        profile: 'ಪ್ರೊಫೈಲ್',
        profileSettings: 'ಪ್ರೊಫೈಲ್ & ಸೆಟ್ಟಿಂಗ್‌ಗಳು',
        logout: 'ಲಾಗ್‌ಔಟ್',
        goodDay: 'ನಮಸ್ಕಾರ',
        welcomeSub: 'ಗಿರಣಿಗಳಿಗೆ ನೇರ ಸಂಪರ್ಕ, ಪಾರದರ್ಶಕ ಬೆಲೆಗಳು ಮತ್ತು ತ್ವರಿತ ಕ್ಯೂಆರ್ ಪರಿಶೀಲನೆ.',
        addNewCrop: 'ಹೊಸ ಬೆಳೆ ಸೇರಿಸಿ',
        activeCrops: 'ಸಕ್ರಿಯ ಬೆಳೆಗಳು',
        sentEnquiries: 'ಕಳುಹಿಸಿದ ವಿಚಾರಣೆಗಳು',
        verificationQrs: 'ಪರಿಶೀಲನಾ ಕ್ಯೂಆರ್',
        directPayments: 'ನೇರ ಪಾವತಿಗಳು',
        settlementsReceived: 'ಸ್ವೀಕರಿಸಿದ ಪಾವತಿಗಳು',
        readyForDelivery: 'ವಿತರಣೆಗೆ ಸಿದ್ಧವಾಗಿದೆ',
        viewQr: 'ಕ್ಯೂಆರ್ ವೀಕ್ಷಿಸಿ',
        paymentsTitle: 'ನೇರ ಗಿರಣಿ ಪಾವತಿಗಳು & ಇತ್ಯರ್ಥ',
        paymentsSubtitle: 'ವೇಬ್ರಿಡ್ಜ್ ತೂಕ, ಕ್ವಿಂಟಾಲ್ ಲೆಕ್ಕಾಚಾರ ಮತ್ತು ಬ್ಯಾಂಕ್ ಖಾತೆಗೆ ನೇರ ಪಾವತಿ',
        updateBankAccount: 'ಬ್ಯಾಂಕ್ ಖಾತೆ ನವೀಕರಿಸಿ',
        totalPaymentsReceived: 'ಒಟ್ಟು ಸ್ವೀಕರಿಸಿದ ಪಾವತಿಗಳು',
        completedTransfers: 'ಯಶಸ್ವಿ ವರ್ಗಾವಣೆಗಳು',
        pendingSettlements: 'ಬಾಕಿ ಪಾವತಿಗಳು',
        totalWeighedProduce: 'ಒಟ್ಟು ತೂಕದ ಬೆಳೆ',
        registeredBankTitle: 'ನೇರ ಪಾವತಿಗಾಗಿ ನೋಂದಾಯಿತ ಬ್ಯಾಂಕ್ ಖಾತೆ',
        verifiedForTransfer: 'ನೇರ ವರ್ಗಾವಣೆಗೆ ದೃಢೀಕರಿಸಲಾಗಿದೆ',
        accountHolder: 'ಖಾತೆದಾರರ ಹೆಸರು',
        bankName: 'ಬ್ಯಾಂಕ್ ಹೆಸರು',
        accountNumber: 'ಖಾತೆ ಸಂಖ್ಯೆ',
        ifscCode: 'IFSC ಕೋಡ್',
        upiId: 'UPI ಐಡಿ',
        allTransactions: 'ಎಲ್ಲಾ ವಹಿವಾಟುಗಳು',
        paymentCompleted: 'ಪಾವತಿ ಪೂರ್ಣಗೊಂಡಿದೆ',
        paymentPending: 'ಪಾವತಿ ಬಾಕಿ ಇದೆ',
        preferredLanguage: 'ಆದ್ಯತೆಯ ಭಾಷೆ',
        save: 'ಉಳಿಸಿ',
        cancel: 'ರದ್ದುಮಾಡಿ',
        footerCopyright: '© 2026 ಕಿಸಾನ್ ಕನೆಕ್ಟ್'
    }
};

// Global direct string reverse map: maps any known English phrase directly to te, hi, kn
const STRING_MAP = {};
Object.keys(TRANSLATIONS.en).forEach(k => {
    const enText = TRANSLATIONS.en[k];
    if (typeof enText === 'string' && enText.trim()) {
        STRING_MAP[enText.trim()] = {
            te: TRANSLATIONS.te[k] || enText,
            hi: TRANSLATIONS.hi[k] || enText,
            kn: TRANSLATIONS.kn[k] || enText
        };
    }
});

// Additional commonly displayed UI sentences & phrases
const EXTRA_PHRASES = {
    "Unified Agricultural Ecosystem": { te: "సమగ్ర వ్యవసాయ డిజిటల్ వ్యవస్థ", hi: "एकीकृत कृषि डिजिटल मंच", kn: "ಸಮಗ್ರ ಕೃಷಿ ಡಿಜಿಟಲ್ ವೇದಿಕೆ" },
    "Farmer Portal": { te: "రైతు పోర్టల్", hi: "किसान पोर्टल", kn: "ರೈತ ಪೋರ್ಟಲ್" },
    "Empower Your Yield": { te: "మీ దిగుబడికి నిజమైన విలువ", hi: "अपनी उपज का सही मूल्य पाएं", kn: "ನಿಮ್ಮ ಬೆಳೆಗೆ ಉತ್ತಮ ಮೌಲ್ಯ" },
    "Grain Procurement": { te: "ధాన్య సేకరణ & ప్రాసెసింగ్", hi: "अनाज खरीद एवं प्रसंस्करण", kn: "ಧಾನ್ಯ ಖರೀದಿ" },
    "Smart Agro-Logistics": { te: "స్మార్ట్ వ్యవసాయ రవాణా", hi: "स्मार्ट कृषि लॉजिस्टिक्स", kn: "ಸ್ಮಾರ್ಟ್ ಕೃಷಿ ಸಾರಿಗೆ" },
    "Transport Provider": { te: "రవాణా సేవలు", hi: "परिवहन सेवा", kn: "ಸಾರಿಗೆ ಸೇವೆಗಳು" },
    "Enter Portal": { te: "పోర్టల్‌లోకి ప్రవేశించండి", hi: "पोर्टल में प्रवेश करें", kn: "ಪ್ರವೇಶಿಸಿ" },
    "Dashboard": { te: "డ్యాష్‌బోర్డ్", hi: "डैशबोर्ड", kn: "ಡ್ಯಾಶ್‌ಬೋರ್ಡ್" },
    "My Crops": { te: "నా పంటలు", hi: "मेरी फसलें", kn: "ನನ್ನ ಬೆಳೆಗಳು" },
    "Nearby Mills": { te: "సమీప మిల్లులు", hi: "नजदीकी मिलें", kn: "ಹತ್ತಿರದ ಗಿರಣಿಗಳು" },
    "My Enquiries": { te: "నా విచారణలు", hi: "मेरी पूछताछ", kn: "ನನ್ನ ವಿಚಾರಣೆಗಳು" },
    "My QR Codes": { te: "నా క్యూఆర్ కోడ్‌లు", hi: "मेरे क्यूआर कोड", kn: "ನನ್ನ ಕ್ಯೂಆರ್ ಕೋಡ್‌ಗಳು" },
    "Payments": { te: "చెల్లింపులు", hi: "भुगतान", kn: "ಪಾವತಿಗಳು" },
    "Load Status": { te: "లోడ్ స్థితి", hi: "लोड स्थिति", kn: "ಲೋಡ್ ಸ್ಥಿತಿ" },
    "Transport": { te: "రవాణా", hi: "परिवहन", kn: "ಸಾರಿಗೆ" },
    "History & Ledger": { te: "చరిత్ర & లెడ్జర్", hi: "इतिहास और लेज़र", kn: "ಇತಿಹಾಸ & ಲೆಡ್ಜರ್" },
    "Market Prices": { te: "మార్కెట్ ధరలు", hi: "मंडी भाव", kn: "ಮಾರುಕಟ್ಟೆ ಬೆಲೆಗಳು" },
    "Profile": { te: "ప్రొఫైల్", hi: "प्रोफ़ाइल", kn: "ಪ್ರೊಫೈಲ್" },
    "Profile & Settings": { te: "ప్రొఫైల్ & సెట్టింగ్‌లు", hi: "प्रोफ़ाइल और सेटिंग्स", kn: "ಪ್ರೊಫೈಲ್ & ಸೆಟ್ಟಿಂಗ್‌ಗಳು" },
    "Logout": { te: "లాగ్ అవుట్", hi: "लॉग आउट", kn: "ಲಾಗ್‌ಔಟ್" },
    "Add New Crop": { te: "కొత్త పంట జోడించండి", hi: "नई फसल जोड़ें", kn: "ಹೊಸ ಬೆಳೆ ಸೇರಿಸಿ" },
    "Active Crops": { te: "క్రియాశీల పంటలు", hi: "सक्रिय फसलें", kn: "ಸಕ್ರಿಯ ಬೆಳೆಗಳು" },
    "Sent Enquiries": { te: "పంపిన విచారణలు", hi: "भेजी गई पूछताछ", kn: "ಕಳುಹಿಸಿದ ವಿಚಾರಣೆಗಳು" },
    "Verification QRs": { te: "ధృవీకరణ క్యూఆర్", hi: "सत्यापन क्यूआर", kn: "ಪರಿಶೀಲನಾ ಕ್ಯೂಆರ್" },
    "Direct Payments": { te: "ప్రత్యక్ష చెల్లింపులు", hi: "सीधा भुगतान", kn: "ನೇರ ಪಾವತಿಗಳು" },
    "Settlements Received": { te: "అందిన చెల్లింపులు", hi: "प्राप्त भुगतान", kn: "ಸ್ವೀಕರಿಸಿದ ಪಾವತಿಗಳು" },
    "Scan-ready for delivery": { te: "రవాణాకు సిద్ధంగా ఉంది", hi: "डिलीवरी के लिए तैयार", kn: "ವಿತರಣೆಗೆ ಸಿದ್ಧವಾಗಿದೆ" },
    "Total Payments Received": { te: "మొత్తం అందిన చెల్లింపులు", hi: "कुल प्राप्त भुगतान", kn: "ಒಟ್ಟು ಸ್ವೀಕರಿಸಿದ ಪಾವತಿಗಳು" },
    "Pending Settlements": { te: "పెండింగ్ చెల్లింపులు", hi: "लंबित भुगतान", kn: "ಬಾಕಿ ಪಾವತಿಗಳು" },
    "Total Weighed Produce": { te: "మొత్తం తూకం వేసిన పంట", hi: "कुल तौला गया माल", kn: "ಒಟ್ಟು ತೂಕದ ಬೆಳೆ" },
    "Update Bank Account": { te: "బ్యాంక్ ఖాతా నవీకరణ", hi: "बैंक खाता बदलें", kn: "ಬ್ಯಾಂಕ್ ಖಾತೆ ನವೀಕರಿಸಿ" },
    "Verified for Direct Transfer": { te: "ప్రత్యక్ష బదిలీకి ధృవీకరించబడింది", hi: "प्रत्यक्ष ट्रांसफर के लिए सत्यापित", kn: "ನೇರ ವರ್ಗಾವಣೆಗೆ ದೃಢೀಕರಿಸಲಾಗಿದೆ" },
    "All Transactions": { te: "అన్ని లావాదేవీలు", hi: "सभी लेन-देन", kn: "ಎಲ್ಲಾ ವಹಿವಾಟುಗಳು" },
    "Payment Completed": { te: "చెల్లింపు పూర్తయింది", hi: "भुगतान पूर्ण", kn: "ಪಾವತಿ ಪೂರ್ಣಗೊಂಡಿದೆ" },
    "Payment Pending": { te: "చెల్లింపు పెండింగ్", hi: "भुगतान लंबित", kn: "ಪಾವತಿ ಬಾಕಿ ಇದೆ" },
    "Enquiry Ref": { te: "విచారణ సంఖ్య", hi: "पूछताछ संदर्भ", kn: "ವಿಚಾರಣೆ ಸಂಖ್ಯೆ" },
    "Purchaser Mill": { te: "కొనుగోలు మిల్లు", hi: "खरीदार मिल", kn: "ಖರೀದಿದಾರ ಗಿರಣಿ" },
    "Crop & Quantity": { te: "పంట & పరిమాణం", hi: "फसल और मात्रा", kn: "ಬೆಳೆ & ಪ್ರಮಾಣ" },
    "Price / Quintal": { te: "క్వింటా ధర", hi: "भाव प्रति क्विंटल", kn: "ದರ / ಕ್ವಿಂಟಾಲ್" },
    "Total Amount": { te: "మొత్తం సొమ్ము", hi: "कुल राशि", kn: "ಒಟ್ಟು ಮೊತ್ತ" },
    "Status": { te: "స్థితి", hi: "स्थिति", kn: "ಸ್ಥಿತಿ" },
    "Payment Date": { te: "చెల్లింపు తేదీ", hi: "भुगतान तिथि", kn: "ಪಾವತಿ ದಿನಾಂಕ" },
    "Receipt": { te: "రసీదు", hi: "रसीद", kn: "ರಸೀದಿ" },
    "View Bill": { te: "బిల్లు చూడండి", hi: "बिल देखें", kn: "ಬಿಲ್ ವೀಕ್ಷಿಸಿ" },
    "View Slip": { te: "స్లిప్ చూడండి", hi: "पर्ची देखें", kn: "ಸ್ಲಿಪ್ ವೀಕ್ಷಿಸಿ" },
    "Close": { te: "మూసివేయి", hi: "बंद करें", kn: "ಮುಚ್ಚಿ" },
    "Print": { te: "ప్రింట్", hi: "प्रिंट करें", kn: "ಮುದ್ರಿಸಿ" },
    "Save Profile Changes": { te: "ప్రొఫైల్ మార్పులు భద్రపరచండి", hi: "विवरण सहेजें", kn: "ಉಳಿಸಿ" },
    "Personal & Agricultural Details": { te: "వ్యక్తిగత మరియు వ్యవసాయ వివరాలు", hi: "व्यक्तिगत एवं कृषि विवरण", kn: "ವೈಯಕ್ತಿಕ & ಕೃಷಿ ವಿವರಗಳು" },
    "Farm & Personal Info": { te: "వ్యవసాయ & వ్యక్తిగత సమాచారం", hi: "कृषि एवं व्यक्तिगत विवरण", kn: "ವೈಯಕ್ತಿಕ ಮಾಹಿತಿ" },
    "Direct Payout & Bank": { te: "బ్యాంక్ వివరాలు & చెల్లింపులు", hi: "बैंक विवरण और भुगतान", kn: "ಬ್ಯಾಂಕ್ & ಪಾವತಿಗಳು" },
    "Security & PIN": { te: "భద్రత & పిన్ (PIN)", hi: "सुरक्षा और पिन (PIN)", kn: "ಭದ್ರತೆ & ಪಿನ್" },
    "Alerts & Language": { te: "హెచ్చరికలు & భాష", hi: "अलर्ट और भाषा", kn: "ಎಚ್ಚರಿಕೆಗಳು & ಭಾಷೆ" },
    "Full Name": { te: "పూర్తి పేరు", hi: "पूरा नाम", kn: "ಪೂರ್ಣ ಹೆಸರು" },
    "Primary Phone (Registered)": { te: "నమోదిత ప్రాథమిక ఫోన్", hi: "पंजीकृत प्राथमिक फोन", kn: "ನೋಂದಾಯಿತ ಫೋನ್" },
    "WhatsApp / Alternate Phone": { te: "వాట్సాప్ / ప్రత్యామ్నాయ ఫోన్", hi: "व्हाट्सएप / वैकल्पिक फोन", kn: "ವಾಟ್ಸಾಪ್ / ಪರ್ಯಾಯ ಫೋನ್" },
    "Village / Gram Panchayat": { te: "గ్రామం / గ్రామ పంచాయితీ", hi: "गाँव / ग्राम पंचायत", kn: "ಗ್ರಾಮ / ಪಂಚಾಯತ್" },
    "District & State": { te: "జిల్లా & రాష్ట్రం", hi: "जिला और राज्य", kn: "ಜಿಲ್ಲೆ & ರಾಜ್ಯ" },
    "Primary Farming Practice": { te: "ప్రధాన వ్యవసాయ పద్ధతి", hi: "मुख्य कृषि पद्धति", kn: "ಮುಖ್ಯ ಕೃಷಿ ಪದ್ಧತಿ" },
    "Total Land Holding": { te: "మొత్తం సాగు భూమి", hi: "कुल जोत भूमि", kn: "ಒಟ್ಟು ಭೂಮಿ" },
    "Registered Crops": { te: "నమోదిత పంటలు", hi: "पंजीकृत फसलें", kn: "ನೋಂದಾಯಿತ ಬೆಳೆಗಳು" },
    "Mill Enquiries": { te: "మిల్లు విచారణలు", hi: "मिल पूछताछ", kn: "ಗಿರಣಿ ವಿಚಾರಣೆಗಳು" },
    "KYC Status": { te: "కేవైసీ (KYC) స్థితి", hi: "केवाईसी (KYC) स्थिति", kn: "ಕೆವೈಸಿ ಸ್ಥಿತಿ" },
    "Verified Farmer": { te: "ధృవీకరించబడిన రైతు", hi: "सत्यापित किसान", kn: "ದೃಢೀಕೃತ ರೈತ" },
    "Account Holder Name": { te: "ఖాతాదారుని పేరు", hi: "खाताधारक का नाम", kn: "ಖಾತೆದಾರರ ಹೆಸರು" },
    "Bank Name": { te: "బ్యాంక్ పేరు", hi: "बैंक का नाम", kn: "ಬ್ಯಾಂಕ್ ಹೆಸರು" },
    "Account Number": { te: "ఖాతా సంఖ్య", hi: "खाता संख्या", kn: "ಖಾತೆ ಸಂಖ್ಯೆ" },
    "IFSC Code": { te: "ఐఎఫ్‌ఎస్‌సి (IFSC) కోడ్", hi: "आईएफएससी (IFSC) कोड", kn: "IFSC ಕೋಡ್" },
    "UPI ID": { te: "యుపిఐ (UPI) ఐడీ", hi: "यूपीआई (UPI) आईडी", kn: "UPI ಐಡಿ" },
    "Payments & Loads": { te: "చెల్లింపులు & లోడ్లు", hi: "भुगतान और लोड", kn: "ಪಾವತಿಗಳು & ಲೋಡ್ಗಳು" },
    "Make Payment": { te: "చెల్లింపు చేయండి", hi: "भुगतान करें", kn: "ಪಾವತಿ ಮಾಡಿ" },
    "Record Produce Intake": { te: "పంట రాక నమోదు", hi: "उपज आवक दर्ज करें", kn: "ದಾಸ್ತಾನು ದಾಖಲಿಸಿ" },
    "Actual Tonnes Received (Weighbridge)": { te: "వేబ్రిడ్జి వాస్తవ టన్నుల తూకం", hi: "वेब्रिज वास्तविक वजन (टन)", kn: "ವೇಬ್ರಿಡ್ಜ್ ತೂಕ (ಟನ್)" },
    "Converted Quintals (1T = 10 Qtl)": { te: "మార్చిన క్వింటాళ్లు (1 టన్ను = 10 క్వింటాళ్లు)", hi: "क्विंटल में परिवर्तन (1 टन = 10 क्विंटल)", kn: "ಕ್ವಿಂಟಾಲ್ ಪರಿವರ್ತನೆ" },
    "Automated Bill Calculation": { te: "ఆటోమేటిక్ బిల్లు లెక్కింపు", hi: "स्वचालित बिल गणना", kn: "ಸ್ವಯಂಚಾಲಿತ ಬಿಲ್ ಲೆಕ್ಕ" },
    "Total Payable Amount": { te: "చెల్లించవలసిన మొత్తం", hi: "कुल देय राशि", kn: "ಒಟ್ಟು ಪಾವತಿಸಬೇಕಾದ ಮೊತ್ತ" },
    "Confirm Load Received": { te: "లోడ్ రసీదును నిర్ధారించండి", hi: "लोड प्राप्ति की पुष्टि करें", kn: "ಲೋಡ್ ದೃಢೀಕರಿಸಿ" },
    "Produce Intake Payment Receipt": { te: "పంట కొనుగోలు చెల్లింపు రసీదు", hi: "अनाज आवक भुगतान रसीद", kn: "ಧಾನ್ಯ ಖರೀದಿ ರಸೀದಿ" },
    "Scan Gate QR": { te: "గేట్ క్యూఆర్ స్కాన్ చేయండి", hi: "गेट क्यूआर स्कैन करें", kn: "ಗೇಟ್ ಕ್ಯೂಆರ್ ಸ್ಕ್ಯಾನ್" }
};
Object.assign(STRING_MAP, EXTRA_PHRASES);


// Build a bidirectional canonical map so any phrase in English, Telugu, Hindi, or Kannada can map to any other language
export const CANONICAL_MAP = {};

Object.keys(TRANSLATIONS.en).forEach(key => {
    ['en', 'te', 'hi', 'kn'].forEach(lang => {
        const text = TRANSLATIONS[lang]?.[key];
        if (text && typeof text === 'string') {
            CANONICAL_MAP[text.trim()] = key;
        }
    });
});

Object.keys(EXTRA_PHRASES).forEach(enText => {
    CANONICAL_MAP[enText.trim()] = enText.trim();
    ['te', 'hi', 'kn'].forEach(lang => {
        const text = EXTRA_PHRASES[enText]?.[lang];
        if (text && typeof text === 'string') {
            CANONICAL_MAP[text.trim()] = enText.trim();
        }
    });
});

export function LanguageProvider({ children }) {
    const [language, setLanguageState] = useState(() => {
        try {
            return localStorage.getItem('kisan_language') || 'en';
        } catch {
            return 'en';
        }
    });

    const setLanguage = (langCode) => {
        setLanguageState(langCode);
        try {
            localStorage.setItem('kisan_language', langCode);

            // Sync with Google Translate engine
            const domain = window.location.hostname;
            document.cookie = `googtrans=/en/${langCode}; path=/;`;
            if (domain && domain !== 'localhost' && !domain.includes('127.0.0.1')) {
                document.cookie = `googtrans=/en/${langCode}; path=/; domain=.${domain};`;
            }

            const triggerGoogleCombo = () => {
                const combo = document.querySelector('.goog-te-combo');
                if (combo) {
                    combo.value = langCode;
                    combo.dispatchEvent(new Event('change'));
                }
            };
            triggerGoogleCombo();
            setTimeout(triggerGoogleCombo, 100);
            setTimeout(triggerGoogleCombo, 350);

            window.dispatchEvent(new CustomEvent('kisan_language_changed', { detail: langCode }));
        } catch (e) {
            console.warn('Could not save language to localStorage:', e);
        }
    };

    // Restore language on initial page load / refresh
    useEffect(() => {
        const saved = localStorage.getItem('kisan_language');
        if (saved && saved !== 'en') {
            document.cookie = `googtrans=/en/${saved}; path=/;`;
            let attempts = 0;
            const checkCombo = setInterval(() => {
                attempts++;
                const combo = document.querySelector('.goog-te-combo');
                if (combo) {
                    combo.value = saved;
                    combo.dispatchEvent(new Event('change'));
                    clearInterval(checkCombo);
                } else if (attempts > 15) {
                    clearInterval(checkCombo);
                }
            }, 250);
        }
    }, []);

    useEffect(() => {
        const handleLangChange = (e) => {
            if (e.detail && e.detail !== language) {
                setLanguageState(e.detail);
            }
        };
        window.addEventListener('kisan_language_changed', handleLangChange);
        return () => window.removeEventListener('kisan_language_changed', handleLangChange);
    }, [language]);

    // Intelligent bidirectional translation helper:
    const t = (keyOrText, fallback = '') => {
        if (!keyOrText) return '';
        const trimmed = typeof keyOrText === 'string' ? keyOrText.trim() : '';

        // 1. Direct key match in active dictionary
        const langDict = TRANSLATIONS[language] || TRANSLATIONS.en;
        if (langDict && langDict[keyOrText] !== undefined) {
            return langDict[keyOrText];
        }

        // 2. Canonical lookup from any language to target language
        const canonicalKey = CANONICAL_MAP[trimmed];
        if (canonicalKey) {
            const translated = TRANSLATIONS[language]?.[canonicalKey] || EXTRA_PHRASES[canonicalKey]?.[language];
            if (translated) return translated;
            if (language === 'en') return canonicalKey;
        }

        // 3. Check STRING_MAP
        if (STRING_MAP[trimmed] && STRING_MAP[trimmed][language]) {
            return STRING_MAP[trimmed][language];
        }

        // 4. Default to English dictionary or fallback
        const defaultDict = TRANSLATIONS.en;
        if (defaultDict[keyOrText] !== undefined) {
            return defaultDict[keyOrText];
        }

        return fallback || keyOrText;
    };

    // Safe Bidirectional DOM Text & Placeholder Translator
    useEffect(() => {
        const translateDom = () => {
            try {
                // 1. Text nodes
                const walker = document.createTreeWalker(
                    document.body,
                    NodeFilter.SHOW_TEXT,
                    {
                        acceptNode: (node) => {
                            if (!node.nodeValue) return NodeFilter.FILTER_REJECT;
                            const text = node.nodeValue.trim();
                            if (text.length > 0 && (CANONICAL_MAP[text] || STRING_MAP[text])) {
                                return NodeFilter.FILTER_ACCEPT;
                            }
                            return NodeFilter.FILTER_SKIP;
                        }
                    }
                );

                const nodesToReplace = [];
                while (walker.nextNode()) {
                    nodesToReplace.push(walker.currentNode);
                }

                nodesToReplace.forEach(node => {
                    const text = node.nodeValue.trim();
                    const key = CANONICAL_MAP[text];
                    if (key) {
                        const targetText = TRANSLATIONS[language]?.[key] || EXTRA_PHRASES[key]?.[language] || (language === 'en' ? key : null);
                        if (targetText && targetText !== text) {
                            node.nodeValue = node.nodeValue.replace(text, targetText);
                        }
                    } else if (STRING_MAP[text] && STRING_MAP[text][language]) {
                        node.nodeValue = node.nodeValue.replace(text, STRING_MAP[text][language]);
                    }
                });

                // 2. Input placeholders
                document.querySelectorAll('input[placeholder], textarea[placeholder]').forEach(el => {
                    const ph = el.placeholder.trim();
                    const key = CANONICAL_MAP[ph];
                    if (key) {
                        const targetText = TRANSLATIONS[language]?.[key] || EXTRA_PHRASES[key]?.[language] || (language === 'en' ? key : null);
                        if (targetText && targetText !== ph) {
                            el.placeholder = targetText;
                        }
                    }
                });
            } catch (err) {
                // Silently ignore transient DOM exceptions
            }
        };

        // Run immediately, then at 50ms, 250ms, and keep active
        translateDom();
        const t1 = setTimeout(translateDom, 50);
        const t2 = setTimeout(translateDom, 250);
        const interval = setInterval(translateDom, 800);

        return () => {
            clearTimeout(t1);
            clearTimeout(t2);
            clearInterval(interval);
        };
    }, [language]);

    return (
        <LanguageContext.Provider value={{
            language,
            setLanguage,
            t,
            languages: LANGUAGES
        }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (!context) {
        return {
            language: 'en',
            setLanguage: () => {},
            t: (k, fb) => fb || k,
            languages: LANGUAGES
        };
    }
    return context;
}
