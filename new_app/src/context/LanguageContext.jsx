import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

export const LANGUAGES = [
    { code: 'en', name: 'English', native: 'English', flag: '🇬🇧' },
    { code: 'te', name: 'Telugu', native: 'తెలుగు', flag: '🌾' },
    { code: 'hi', name: 'Hindi', native: 'हिन्दी', flag: '🇮🇳' },
    { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ', flag: '🌱' }
];

export const TRANSLATIONS = {
    en: {
        // Navigation & General
        appName: 'KisanConnect',
        tagline: 'Unified Agricultural Ecosystem',
        dashboard: 'Dashboard',
        crops: 'My Crops',
        mills: 'Nearby Mills',
        enquiries: 'My Enquiries',
        qrcodes: 'My QR Codes',
        payments: 'Payments',
        loadstatus: 'Load Status',
        transport: 'Transport',
        history: 'History & Ledger',
        market: 'Market Prices',
        profile: 'Profile',
        logout: 'Logout',
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
        
        // Payments Tab
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
        
        // Profile & Preferences
        profileTitle: 'Farmer Profile & Settings',
        generalTab: 'General Details',
        payoutTab: 'Direct Payout & Bank',
        securityTab: 'Security PIN',
        preferencesTab: 'Preferences & Language',
        preferredLanguage: 'Preferred Language',
        languageSettingDesc: 'Select your regional language for dashboard labels, crop information, and notifications.',
        savePreferences: 'Save Preferences',
        savedSuccess: 'Language preference saved successfully!',
        
        // Mill / Buyer Portal
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
        
        // Landing Page
        enterPortal: 'Enter Portal',
        farmerPortalTitle: 'Farmer Portal',
        farmerPortalDesc: 'Real-time weather, market rates, direct mill enquiries, QR gate pass, and instant direct bank payments.',
        millPortalTitle: 'Mills',
        millPortalDesc: 'Weighbridge intake, automated quintal conversions, direct farmer bank payouts, and gate QR scans.',
        transportPortalTitle: 'Transport Provider',
        transportPortalDesc: 'Smart truck capacity matching, haulage bids, trip progress, and freight payouts.'
    },

    te: {
        // Navigation & General (తెలుగు)
        appName: 'కిసాన్ కనెక్ట్',
        tagline: 'సమగ్ర వ్యవసాయ డిజిటల్ వ్యవస్థ',
        dashboard: 'డ్యాష్‌బోర్డ్',
        crops: 'నా పంటలు',
        mills: 'సమీప మిల్లులు',
        enquiries: 'నా విచారణలు',
        qrcodes: 'నా క్యూఆర్ కోడ్‌లు',
        payments: 'చెల్లింపులు',
        loadstatus: 'లోడ్ స్థితి',
        transport: 'రవాణా',
        history: 'చరిత్ర & లెడ్జర్',
        market: 'మార్కెట్ ధరలు',
        profile: 'ప్రొఫైల్',
        logout: 'లాగ్ అవుట్',
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

        // Payments Tab
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

        // Profile & Preferences
        profileTitle: 'రైతు ప్రొఫైల్ & సెట్టింగ్‌లు',
        generalTab: 'సాధారణ వివరాలు',
        payoutTab: 'బ్యాంక్ వివరాలు & చెల్లింపులు',
        securityTab: 'సెక్యూరిటీ పిన్ (PIN)',
        preferencesTab: 'ప్రాధాన్యతలు & భాష',
        preferredLanguage: 'ఇష్టపడే ప్రాంతీయ భాష',
        languageSettingDesc: 'డ్యాష్‌బోర్డ్, పంట వివరాలు మరియు నోటిఫికేషన్‌ల కోసం మీ స్థానిక భాషను ఎంచుకోండి.',
        savePreferences: 'ప్రాధాన్యతలు భద్రపరచండి',
        savedSuccess: 'భాష విజయవంతంగా మార్చబడింది!',

        // Mill / Buyer Portal
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

        // Landing Page
        enterPortal: 'పోర్టల్‌లోకి ప్రవేశించండి',
        farmerPortalTitle: 'రైతు పోర్టల్',
        farmerPortalDesc: 'వాతావరణం, మార్కెట్ ధరలు, మిల్లు విచారణలు, క్యూఆర్ గేట్ పాస్ మరియు బ్యాంక్ చెల్లింపులు.',
        millPortalTitle: 'రైస్ & దాల్ మిల్లులు',
        millPortalDesc: 'వేబ్రిడ్జి తూకం, ఆటోమేటిక్ క్వింటాళ్ల బిల్లు, రైతులకు నేరుగా చెల్లింపులు మరియు క్యూఆర్ స్కానింగ్.',
        transportPortalTitle: 'రవాణా సేవలు',
        transportPortalDesc: 'స్మార్ట్ ట్రక్ కెపాసిటీ మ్యాచింగ్, రవాణా ధరలు మరియు ప్రత్యక్ష ట్రాకింగ్.'
    },

    hi: {
        // Navigation & General (हिन्दी)
        appName: 'किसान कनेक्ट',
        tagline: 'एकीकृत कृषि डिजिटल मंच',
        dashboard: 'डैशबोर्ड',
        crops: 'मेरी फसलें',
        mills: 'नजदीकी मिलें',
        enquiries: 'मेरी पूछताछ',
        qrcodes: 'मेरे क्यूआर कोड',
        payments: 'भुगतान',
        loadstatus: 'लोड स्थिति',
        transport: 'परिवहन',
        history: 'इतिहास और लेज़र',
        market: 'मंडी भाव',
        profile: 'प्रोफ़ाइल',
        logout: 'लॉग आउट',
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

        // Payments Tab
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

        // Profile & Preferences
        profileTitle: 'किसान प्रोफ़ाइल और सेटिंग्स',
        generalTab: 'सामान्य विवरण',
        payoutTab: 'बैंक विवरण और भुगतान',
        securityTab: 'सुरक्षा पिन (PIN)',
        preferencesTab: 'प्राथमिकताएं और भाषा',
        preferredLanguage: 'पसंदीदा क्षेत्रीय भाषा',
        languageSettingDesc: 'डैशबोर्ड और अलर्ट्स के लिए अपनी क्षेत्रीय भाषा चुनें।',
        savePreferences: 'प्राथमिकताएं सहेजें',
        savedSuccess: 'भाषा प्राथमिकता सफलतापूर्वक अपडेट हो गई!',

        // Mill / Buyer Portal
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

        // Landing Page
        enterPortal: 'पोर्टल में प्रवेश करें',
        farmerPortalTitle: 'किसान पोर्टल',
        farmerPortalDesc: 'मौसम, मंडी भाव, मिल पूछताछ, क्यूआर गेट पास और त्वरित प्रत्यक्ष भुगतान।',
        millPortalTitle: 'मिल एवं खरीददार',
        millPortalDesc: 'वेब्रिज तौल, स्वचालित क्विंटल बिल, सीधे बैंक ट्रांसफर और क्यूआर स्कैन।',
        transportPortalTitle: 'परिवहन सेवा',
        transportPortalDesc: 'स्मार्ट ट्रक क्षमता मिलान, भाड़ा बोली और लाइव जीपीएस ट्रैकिंग।'
    },

    kn: {
        // Navigation & General (ಕನ್ನಡ)
        appName: 'ಕಿಸಾನ್ ಕನೆಕ್ಟ್',
        tagline: 'ಸಮಗ್ರ ಕೃಷಿ ಡಿಜಿಟಲ್ ವೇದಿಕೆ',
        dashboard: 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್',
        crops: 'ನನ್ನ ಬೆಳೆಗಳು',
        mills: 'ಹತ್ತಿರದ ಗಿರಣಿಗಳು',
        enquiries: 'ನನ್ನ ವಿಚಾರಣೆಗಳು',
        qrcodes: 'ನನ್ನ ಕ್ಯೂಆರ್ ಕೋಡ್‌ಗಳು',
        payments: 'ಪಾವತಿಗಳು',
        loadstatus: 'ಲೋಡ್ ಸ್ಥಿತಿ',
        transport: 'ಸಾರಿಗೆ',
        history: 'ಇತಿಹಾಸ & ಲೆಡ್ಜರ್',
        market: 'ಮಾರುಕಟ್ಟೆ ಬೆಲೆಗಳು',
        profile: 'ಪ್ರೊಫೈಲ್',
        logout: 'ಲಾಗ್‌ಔಟ್',
        goodDay: 'ನಮಸ್ಕಾರ',
        welcomeSub: 'ಗಿರಣಿಗಳಿಗೆ ನೇರ ಸಂಪರ್ಕ, ಪಾರದರ್ಶಕ ಧಾನ್ಯ ಬೆಲೆಗಳು ಮತ್ತು ತ್ವರಿತ ಕ್ಯೂಆರ್ ಪರಿಶೀಲನೆ.',
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
        allTransactions: 'ಎಲ್ಲಾ ವಹಿವಾಟುಗಳು',
        paymentCompleted: 'ಪಾವತಿ ಪೂರ್ಣಗೊಂಡಿದೆ',
        paymentPending: 'ಪಾವತಿ ಬಾಕಿ ಇದೆ',
        preferredLanguage: 'ಆದ್ಯತೆಯ ಭಾಷೆ',
        enterPortal: 'ಪ್ರವೇಶಿಸಿ'
    }
};

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
            window.dispatchEvent(new CustomEvent('kisan_language_changed', { detail: langCode }));
        } catch (e) {
            console.warn('Could not save language to localStorage:', e);
        }
    };

    useEffect(() => {
        const handleLangChange = (e) => {
            if (e.detail && e.detail !== language) {
                setLanguageState(e.detail);
            }
        };
        window.addEventListener('kisan_language_changed', handleLangChange);
        return () => window.removeEventListener('kisan_language_changed', handleLangChange);
    }, [language]);

    // Translate helper function
    const t = (key, fallback = '') => {
        const langDict = TRANSLATIONS[language] || TRANSLATIONS.en;
        if (langDict && langDict[key] !== undefined) {
            return langDict[key];
        }
        const defaultDict = TRANSLATIONS.en;
        return defaultDict[key] !== undefined ? defaultDict[key] : (fallback || key);
    };

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
