import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-analytics.js";
import { getFirestore, doc, getDoc, setDoc, collection, getDocs, deleteDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { fetchWeatherByCoords } from "./weather.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: "",
    authDomain: "green-grid-b2222.firebaseapp.com",
    projectId: "green-grid-b2222",
    storageBucket: "green-grid-b2222.firebasestorage.app",
    messagingSenderId: "367679697189",
    appId: "1:367679697189:web:ef5ad8ebe8f02df185eacc",
    measurementId: "G-0R0BCB59E3"
};

try {
    const config = await import("./config.js");
    if (config.firebaseConfig && config.firebaseConfig.apiKey) {
        firebaseConfig.apiKey = config.firebaseConfig.apiKey;
    }
} catch (error) {
    console.warn("Local config.js not found. Using default placeholders.");
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);

document.addEventListener('DOMContentLoaded', () => {
    // Portal Selection Logic
    const landingPage = document.getElementById('landing-page');
    const mainApp = document.getElementById('main-app');
    const btnFarmer = document.getElementById('btn-farmer');
    const btnBuyer = document.getElementById('btn-buyer');
    const btnMill = document.getElementById('btn-mill');
    const btnConsumer = document.getElementById('btn-consumer');

    // Auth Modal
    const authModal = document.getElementById('auth-modal');
    const closeAuth = document.getElementById('close-auth');
    const actionStepTitle = document.getElementById('action-step-title');
    const actionStep = document.getElementById('action-step');
    const authFormStep = document.getElementById('auth-form-step');
    const authFormTitle = document.getElementById('auth-form-title');
    const authFormDesc = document.getElementById('auth-form-desc');
    const phoneInput = document.getElementById('phone-input');
    const pinInput = document.getElementById('pin-input');
    const btnChooseLogin = document.getElementById('btn-choose-login');
    const btnChooseSignup = document.getElementById('btn-choose-signup');
    const btnAuthSubmit = document.getElementById('btn-auth-submit');
    const btnBackAction = document.getElementById('btn-back-action');
    const authError = document.getElementById('auth-error');

    let currentPhoneNumber = '';
    let isNewUser = false;
    let currentRole = 'farmers';
    let authAction = 'login'; // 'login' or 'signup'

    function openAuthModal(role, displayName) {
        currentRole = role;
        if (actionStepTitle) actionStepTitle.textContent = displayName;
        if (authModal) authModal.style.display = 'flex';
        if (actionStep) actionStep.style.display = 'block';
        if (authFormStep) authFormStep.style.display = 'none';
        if (phoneInput) phoneInput.value = '';
        if (pinInput) pinInput.value = '';
        if (authError) authError.style.display = 'none';
    }

    if (btnChooseLogin) {
        btnChooseLogin.addEventListener('click', () => {
            authAction = 'login';
            if (authFormTitle) authFormTitle.textContent = 'Portal Login';
            if (authFormDesc) authFormDesc.textContent = 'Enter your 10-digit phone number and 6-digit PIN to login';
            if (btnAuthSubmit) btnAuthSubmit.textContent = 'Login';
            actionStep.style.display = 'none';
            authFormStep.style.display = 'block';
        });
    }

    if (btnChooseSignup) {
        btnChooseSignup.addEventListener('click', () => {
            authAction = 'signup';
            if (authFormTitle) authFormTitle.textContent = 'Portal Sign Up';
            if (authFormDesc) authFormDesc.textContent = 'Create an account with your phone number and a new 6-digit PIN';
            if (btnAuthSubmit) btnAuthSubmit.textContent = 'Sign Up';
            actionStep.style.display = 'none';
            authFormStep.style.display = 'block';
        });
    }

    if (btnBackAction) {
        btnBackAction.addEventListener('click', () => {
            authFormStep.style.display = 'none';
            actionStep.style.display = 'block';
            phoneInput.value = '';
            pinInput.value = '';
            authError.style.display = 'none';
        });
    }

    if (btnFarmer) btnFarmer.addEventListener('click', () => openAuthModal('farmers', 'Farmer Portal'));
    if (btnBuyer) btnBuyer.addEventListener('click', () => openAuthModal('buyers', 'Buyer Portal'));
    if (btnMill) btnMill.addEventListener('click', () => openAuthModal('mills', 'Mill Portal'));
    if (btnConsumer) btnConsumer.addEventListener('click', () => openAuthModal('consumers', 'Consumer Portal'));

    if (closeAuth) {
        closeAuth.addEventListener('click', () => {
            authModal.style.display = 'none';
        });
    }

    // Auth Form Submit Logic
    if (btnAuthSubmit) {
        btnAuthSubmit.addEventListener('click', async () => {
            const phone = phoneInput.value.trim();
            const pin = pinInput.value.trim();

            if (phone.length !== 10 || isNaN(phone)) {
                authError.textContent = 'Please enter a valid 10-digit phone number.';
                authError.style.display = 'block';
                return;
            }

            if (pin.length !== 6 || isNaN(pin)) {
                authError.textContent = 'Please enter a valid 6-digit PIN.';
                authError.style.display = 'block';
                return;
            }

            authError.style.display = 'none';
            btnAuthSubmit.textContent = authAction === 'login' ? 'Logging in...' : 'Signing up...';
            btnAuthSubmit.disabled = true;

            try {
                const userRef = doc(db, currentRole, phone);
                const userSnap = await getDoc(userRef);

                if (authAction === 'login') {
                    if (userSnap.exists()) {
                        // User exists, verify PIN
                        if (userSnap.data().pin === pin) {
                            currentPhoneNumber = phone;
                            loginSuccess();
                        } else {
                            // Incorrect PIN
                            authError.textContent = 'Wrong password. Please try again.';
                            authError.style.display = 'block';
                        }
                    } else {
                        authError.textContent = 'Account not found. Please sign up first.';
                        authError.style.display = 'block';
                    }
                } else if (authAction === 'signup') {
                    if (userSnap.exists()) {
                        authError.textContent = 'Account already exists. Please login instead.';
                        authError.style.display = 'block';
                    } else {
                        // Create new user
                        await setDoc(userRef, {
                            phone: phone,
                            pin: pin,
                            role: currentRole.slice(0, -1),
                            createdAt: new Date()
                        });
                        currentPhoneNumber = phone;
                        loginSuccess();
                    }
                }
            } catch (error) {
                console.error("Error during authentication:", error);
                authError.textContent = 'Error connecting to database. Please try again.';
                authError.style.display = 'block';
            } finally {
                if (authModal.style.display !== 'none') {
                    btnAuthSubmit.textContent = authAction === 'login' ? 'Login' : 'Sign Up';
                    btnAuthSubmit.disabled = false;
                }
            }
        });
    }

    function loginSuccess() {
        authModal.style.display = 'none';

        // Form a simple user simulation
        document.querySelector('.user-info h4').textContent = currentPhoneNumber;
        const roleDisplay = currentRole === 'buyers' ? 'Verified Buyer' :
            currentRole === 'mills' ? 'Verified Mill' :
                currentRole === 'consumers' ? 'Verified Consumer' : 'Verified Farmer';
        document.querySelector('.user-info p').textContent = roleDisplay;

        // Update greeting correctly
        updateGreeting();

        // Fade out landing page
        landingPage.style.opacity = '0';
        landingPage.style.transition = 'opacity 0.5s ease';

        setTimeout(() => {
            landingPage.style.display = 'none';
            mainApp.style.display = 'flex';
            // Small animation for main app
            mainApp.style.opacity = '0';
            mainApp.style.animation = 'fadeInUp 0.8s ease-out forwards';
        }, 500);

        fetchUserCrops();
    }

    async function fetchUserCrops() {
        if (!currentRole || !currentPhoneNumber || !db) return;

        const myCropsList = document.getElementById('my-crops-list');
        const noCropsRow = document.getElementById('no-crops-row');
        const dashCropName = document.getElementById('dashboard-crop-name');
        const dashCropLoc = document.getElementById('dashboard-crop-location');

        try {
            const cropsRef = collection(db, `${currentRole}/${currentPhoneNumber}/crops`);
            const cropsSnapshot = await getDocs(cropsRef);

            if (!cropsSnapshot.empty) {
                if (noCropsRow) noCropsRow.style.display = 'none';

                // Clear existing crops just in case to avoid duplicates
                if (myCropsList) {
                    Array.from(myCropsList.children).forEach(child => {
                        if (child.id !== 'no-crops-row') {
                            child.remove();
                        }
                    });
                }

                let cropCount = 0;
                let lastCropName = '';
                let lastCropLoc = '';
                let lastLat = null;
                let lastLng = null;

                cropsSnapshot.forEach((docSnap) => {
                    const data = docSnap.data();
                    cropCount++;

                    const finalCropName = data.cropName || 'Unknown Crop';
                    const locName = data.locationName || 'Unknown Location';

                    lastCropName = finalCropName;
                    lastCropLoc = locName;
                    if (data.latitude && data.longitude) {
                        lastLat = data.latitude;
                        lastLng = data.longitude;
                    }

                    let dateAdded = 'Unknown Date';
                    if (data.addedAt && data.addedAt.toDate) {
                        dateAdded = data.addedAt.toDate().toLocaleDateString('en-IN', {
                            day: '2-digit', month: 'short', year: 'numeric'
                        });
                    }

                    if (myCropsList) {
                        const newRow = document.createElement('tr');
                        newRow.style.borderBottom = '1px solid var(--border-color)';
                        const docId = docSnap.id;

                        newRow.innerHTML = `
                            <td style="padding: 1rem;">
                                <div style="display: flex; align-items: center; gap: 0.75rem;">
                                    <div style="width: 32px; height: 32px; border-radius: 8px; background: rgba(0,255,136,0.1); display: flex; align-items: center; justify-content: center; color: var(--primary);">
                                        <i class="fa-solid fa-leaf"></i>
                                    </div>
                                    <span style="font-weight: 500;">${finalCropName}</span>
                                </div>
                            </td>
                            <td style="padding: 1rem; color: var(--text-muted);">
                                <i class="fa-solid fa-location-dot" style="margin-right: 0.5rem; color: var(--primary);"></i> ${locName}
                            </td>
                            <td style="padding: 1rem; color: var(--text-muted);">${data.acres || '-'} Acres</td>
                            <td style="padding: 1rem; color: var(--text-muted);">${dateAdded}</td>
                            <td style="padding: 1rem; text-align: center;">
                                <button class="action-btn text-btn delete-crop-btn" data-id="${docId}" style="color: var(--danger); font-size: 0.9rem;" title="Remove Crop">
                                    <i class="fa-solid fa-trash"></i>
                                </button>
                            </td>
                        `;
                        myCropsList.appendChild(newRow);
                    }
                });

                // Update Dashboard Active Crops section
                if (dashCropName) {
                    if (cropCount > 1) {
                        dashCropName.textContent = `${cropCount} Lots`;
                        if (dashCropLoc) {
                            dashCropLoc.textContent = `${lastCropName} & more`;
                            dashCropLoc.classList.remove('neutral');
                            dashCropLoc.classList.add('up');
                        }
                    } else if (cropCount === 1) {
                        dashCropName.textContent = lastCropName;
                        if (dashCropLoc) {
                            dashCropLoc.textContent = lastCropLoc;
                            dashCropLoc.classList.remove('neutral');
                            dashCropLoc.classList.add('up');
                        }
                    }
                }

                // Update Dashboard Weather for the last added location
                if (lastLat && lastLng) {
                    fetchWeatherByCoords(lastLat, lastLng);
                }

            } else {
                if (noCropsRow) noCropsRow.style.display = 'table-row';
                if (dashCropName) dashCropName.textContent = '0 Lots';
                if (dashCropLoc) {
                    dashCropLoc.textContent = 'Add crops to track';
                    dashCropLoc.classList.remove('up');
                    dashCropLoc.classList.add('neutral');
                }
            }
        } catch (error) {
            console.error("Error fetching user crops:", error);
        }
    }

    // Back Button Logic
    const btnBack = document.getElementById('btn-back');
    if (btnBack && landingPage && mainApp) {
        btnBack.addEventListener('click', () => {
            // Fade out main app
            mainApp.style.opacity = '0';
            mainApp.style.transition = 'opacity 0.4s ease';

            setTimeout(() => {
                mainApp.style.display = 'none';
                landingPage.style.display = 'flex';
                // Animate landing page back in
                landingPage.style.opacity = '0';
                landingPage.style.animation = 'fadeInDown 0.6s ease-out forwards';
            }, 400);
        });
    }

    // Handle Navigation Active State
    const navItems = document.querySelectorAll('.nav-item');
    const viewSections = document.querySelectorAll('.view-section');

    navItems.forEach(item => {
        item.addEventListener('click', function (e) {
            // Specifically exclude logout from getting active state
            if (this.classList.contains('logout')) {
                // Fade out main app and go back to landing
                mainApp.style.opacity = '0';
                mainApp.style.transition = 'opacity 0.4s ease';
                setTimeout(() => {
                    mainApp.style.display = 'none';
                    landingPage.style.display = 'flex';
                    landingPage.style.opacity = '0';
                    landingPage.style.animation = 'fadeInDown 0.6s ease-out forwards';
                }, 400);
                return;
            }

            navItems.forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');

            // Handle Section Switching
            const targetId = this.getAttribute('data-target');
            if (targetId) {
                viewSections.forEach(section => {
                    section.style.display = 'none';
                });
                const targetSection = document.getElementById(targetId);
                if (targetSection) {
                    targetSection.style.display = 'block';
                }
            }
        });
    });

    // Handle Notifications
    const notificationsBtn = document.querySelector('.notifications');
    if (notificationsBtn) {
        notificationsBtn.addEventListener('click', () => {
            alert('You have 3 new notifications related to crop prices and weather alerts.');
        });
    }

    // Handlers for Add Crop feature
    const btnAddCrop = document.getElementById('btn-add-crop');
    const addCropModal = document.getElementById('add-crop-modal');
    const closeAddCrop = document.getElementById('close-add-crop');
    const cropSelect = document.getElementById('crop-select');
    const customCropGroup = document.getElementById('custom-crop-group');
    const customCropInput = document.getElementById('custom-crop-input');
    const btnSaveCrop = document.getElementById('btn-save-crop');

    if (btnAddCrop && addCropModal) {
        btnAddCrop.addEventListener('click', () => {
            addCropModal.style.display = 'flex';
            if (cropSelect) cropSelect.value = '';
            if (customCropGroup) customCropGroup.style.display = 'none';
            if (customCropInput) customCropInput.value = '';
        });
    }

    if (closeAddCrop && addCropModal) {
        closeAddCrop.addEventListener('click', () => {
            addCropModal.style.display = 'none';
        });
    }

    if (cropSelect && customCropGroup) {
        cropSelect.addEventListener('change', (e) => {
            if (e.target.value === 'Other') {
                customCropGroup.style.display = 'flex';
                customCropGroup.style.flexDirection = 'row';
                if (customCropInput) customCropInput.focus();
            } else {
                customCropGroup.style.display = 'none';
            }
        });
    }

    // Leaflet Map Logic Variables
    let map = null;
    let marker = null;
    let selectedLat = null;
    let selectedLng = null;

    const btnOpenMap = document.getElementById('btn-open-map');
    const mapModal = document.getElementById('map-modal');
    const closeMapModal = document.getElementById('close-map-modal');
    const btnCancelMap = document.getElementById('btn-cancel-map');
    const btnConfirmLocation = document.getElementById('btn-confirm-location');
    const cropLocationInput = document.getElementById('crop-location-input');

    // Make crop input open map as well
    if (cropLocationInput && mapModal) {
        cropLocationInput.addEventListener('click', openMapModal);
    }

    if (btnOpenMap && mapModal) {
        btnOpenMap.addEventListener('click', openMapModal);
    }

    function openMapModal(e) {
        e.preventDefault();
        mapModal.style.display = 'flex';

        // Initialize map if it doesn't exist
        if (!map) {
            // Default center: India (approx)
            map = L.map('crop-map').setView([20.5937, 78.9629], 5);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors'
            }).addTo(map);

            map.on('click', function (e) {
                const lat = e.latlng.lat;
                const lng = e.latlng.lng;

                if (marker) {
                    marker.setLatLng(e.latlng);
                } else {
                    marker = L.marker(e.latlng).addTo(map);
                }

                selectedLat = lat;
                selectedLng = lng;
                btnConfirmLocation.disabled = false;
            });
        }

        // Timeout to fix leaflet sizing issue inside modals
        setTimeout(() => { map.invalidateSize(); }, 200);
    }

    function closeMapHandler(e) {
        if (e) e.preventDefault();
        mapModal.style.display = 'none';

        // Clear search if any
        const searchInput = document.getElementById('map-search-input');
        if (searchInput) searchInput.value = '';
    }

    if (closeMapModal) closeMapModal.addEventListener('click', closeMapHandler);
    if (btnCancelMap) btnCancelMap.addEventListener('click', closeMapHandler);

    // Map Search Logic
    const btnMapSearch = document.getElementById('btn-map-search');
    const mapSearchInput = document.getElementById('map-search-input');

    if (btnMapSearch && mapSearchInput) {
        btnMapSearch.addEventListener('click', async (e) => {
            e.preventDefault();
            const query = mapSearchInput.value.trim();
            if (!query) return;

            btnMapSearch.textContent = '...';

            try {
                const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`);
                const data = await res.json();

                if (data && data.length > 0) {
                    const lat = parseFloat(data[0].lat);
                    const lon = parseFloat(data[0].lon);

                    selectedLat = lat;
                    selectedLng = lon;

                    map.setView([lat, lon], 12);

                    if (marker) {
                        marker.setLatLng([lat, lon]);
                    } else {
                        marker = L.marker([lat, lon]).addTo(map);
                    }

                    btnConfirmLocation.disabled = false;
                } else {
                    alert('Location not found.');
                }
            } catch (err) {
                console.error("Search failed:", err);
                alert("Error searching location.");
            }

            btnMapSearch.textContent = 'Search';
        });

        // Allow enter key searching
        mapSearchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                btnMapSearch.click();
            }
        });
    }

    if (btnConfirmLocation) {
        btnConfirmLocation.addEventListener('click', async (e) => {
            e.preventDefault();
            btnConfirmLocation.textContent = "Loading...";

            try {
                // Reverse geocode using Nominatim to get city name
                const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${selectedLat}&lon=${selectedLng}`);
                const data = await res.json();

                let placeName = "Selected Location";
                if (data.address) {
                    placeName = data.address.city || data.address.town || data.address.village || data.address.county || data.address.state;
                }

                cropLocationInput.value = placeName;
                document.getElementById('crop-lat').value = selectedLat;
                document.getElementById('crop-lng').value = selectedLng;

            } catch (err) {
                console.error("Geocoding failed", err);
                cropLocationInput.value = `${selectedLat.toFixed(2)}, ${selectedLng.toFixed(2)}`;
            }

            btnConfirmLocation.textContent = "Confirm Location";
            closeMapHandler();
        });
    }

    if (btnSaveCrop) {
        btnSaveCrop.addEventListener('click', async () => {
            const cropVal = cropSelect.value;
            let finalCropName = cropVal;

            if (!cropVal) {
                alert("Please select a crop.");
                return;
            }

            if (cropVal === 'Other') {
                finalCropName = customCropInput.value.trim();
                if (!finalCropName) {
                    alert("Please enter a custom crop name.");
                    return;
                }
            }

            const latVal = document.getElementById('crop-lat').value;
            const lngVal = document.getElementById('crop-lng').value;
            const locName = cropLocationInput.value;
            const acresInput = document.getElementById('crop-acres-input');
            const acresVal = acresInput ? acresInput.value.trim() : "";

            if (!latVal || !lngVal) {
                alert("Please pick a crop location from the map.");
                return;
            }

            if (!acresVal || isNaN(parseFloat(acresVal)) || parseFloat(acresVal) <= 0) {
                alert("Please enter a valid number of acres.");
                return;
            }

            btnSaveCrop.textContent = "Saving...";

            // 1. Instantly Update Weather Dashboard
            fetchWeatherByCoords(latVal, lngVal);

            try {
                // Dynamically import specific firestore methods required 
                // Alternatively relying on globals we used in script.js head.
                const { setDoc, doc } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");

                // Save crop details into Firebase under current logged in user (if they are logged in)
                let cropId = `crop_${Date.now()}`;
                if (currentPhoneNumber && currentRole) {
                    const cropRef = doc(db, `${currentRole}/${currentPhoneNumber}/crops/${cropId}`);

                    await setDoc(cropRef, {
                        cropName: finalCropName,
                        locationName: locName,
                        latitude: latVal,
                        longitude: lngVal,
                        acres: parseFloat(acresVal),
                        addedAt: new Date()
                    });
                } else {
                    console.warn("User not fully authenticated but saving was bypassed in dev. Crop not persisted to cloud.");
                }

                alert(`Successfully saved crop: ${finalCropName} at ${locName} to database!`);

                // Update Dashboard UI
                const dashCropName = document.getElementById('dashboard-crop-name');
                const dashCropLoc = document.getElementById('dashboard-crop-location');
                if (dashCropName) dashCropName.textContent = finalCropName;
                if (dashCropLoc) {
                    dashCropLoc.textContent = locName;
                    dashCropLoc.classList.remove('neutral');
                    dashCropLoc.classList.add('up');
                }

                // Add to My Crops list
                const myCropsList = document.getElementById('my-crops-list');
                const noCropsRow = document.getElementById('no-crops-row');
                if (myCropsList) {
                    if (noCropsRow) noCropsRow.style.display = 'none';

                    const newRow = document.createElement('tr');
                    newRow.style.borderBottom = '1px solid var(--border-color)';

                    const dateAdded = new Date().toLocaleDateString('en-IN', {
                        day: '2-digit', month: 'short', year: 'numeric'
                    });

                    newRow.innerHTML = `
                        <td style="padding: 1rem;">
                            <div style="display: flex; align-items: center; gap: 0.75rem;">
                                <div style="width: 32px; height: 32px; border-radius: 8px; background: rgba(0,255,136,0.1); display: flex; align-items: center; justify-content: center; color: var(--primary);">
                                    <i class="fa-solid fa-leaf"></i>
                                </div>
                                <span style="font-weight: 500;">${finalCropName}</span>
                            </div>
                        </td>
                        <td style="padding: 1rem; color: var(--text-muted);">
                            <i class="fa-solid fa-location-dot" style="margin-right: 0.5rem; color: var(--primary);"></i> ${locName}
                        </td>
                        <td style="padding: 1rem; color: var(--text-muted);">${parseFloat(acresVal)} Acres</td>
                        <td style="padding: 1rem; color: var(--text-muted);">${dateAdded}</td>
                        <td style="padding: 1rem; text-align: center;">
                            <button class="action-btn text-btn delete-crop-btn" data-id="${cropId}" style="color: var(--danger); font-size: 0.9rem;" title="Remove Crop">
                                <i class="fa-solid fa-trash"></i>
                            </button>
                        </td>
                    `;
                    myCropsList.appendChild(newRow);
                }

                // reset form
                cropLocationInput.value = '';
                document.getElementById('crop-lat').value = '';
                document.getElementById('crop-lng').value = '';
                if (acresInput) acresInput.value = '';
                if (addCropModal) addCropModal.style.display = 'none';

            } catch (err) {
                console.error("Failed to save crop: ", err);
                alert(`Couldn't save to the database, but updated your dashboard weather for preview!`);
                // Close modal anyway in dev environment so they can preview weather:
                if (addCropModal) addCropModal.style.display = 'none';
            } finally {
                btnSaveCrop.textContent = "Save Crop";
            }
        });
    }

    // Function to handle real-time date and time updating
    function updateDateTime() {
        const timeEl = document.getElementById('current-time');
        const dateEl = document.getElementById('current-date');

        if (timeEl && dateEl) {
            const now = new Date();

            // Format time e.g., "10:30 AM"
            const timeOptions = { hour: 'numeric', minute: '2-digit', hour12: true };
            timeEl.textContent = now.toLocaleTimeString('en-IN', timeOptions);

            // Format date e.g., "Tue, 03 Oct 2026"
            const dateOptions = { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' };
            dateEl.textContent = now.toLocaleDateString('en-IN', dateOptions);
        }
    }

    // Immediately call then update every second
    updateDateTime();
    setInterval(updateDateTime, 1000);

    // Dynamic Greeting based on time
    const updateGreeting = () => {
        const greetingElement = document.querySelector('.welcome-section h1');
        if (!greetingElement) return;

        const hour = new Date().getHours();
        let greetingTerm = 'Good Morning';
        let emoji = '🌤️';

        if (hour >= 12 && hour < 17) {
            greetingTerm = 'Good Afternoon';
            emoji = '☀️';
        } else if (hour >= 17) {
            greetingTerm = 'Good Evening';
            emoji = '🌙';
        }

        // Just update the first node logic or reset it
        // Note: Using innerHTML could be an issue if there is span inside. We do it simple.
        let roleName = 'Farmer';
        if (currentRole === 'buyers') roleName = 'Buyer';
        if (currentRole === 'mills') roleName = 'Mill Owner';
        if (currentRole === 'consumers') roleName = 'Consumer';

        greetingElement.innerHTML = `${greetingTerm}, ${roleName}! ${emoji}`;
    };

    updateGreeting();

    // Handle Deletion from My Crops List
    const myCropsListEl = document.getElementById('my-crops-list');
    if (myCropsListEl) {
        myCropsListEl.addEventListener('click', async (e) => {
            const btn = e.target.closest('.delete-crop-btn');
            if (!btn) return;

            const cropId = btn.getAttribute('data-id');
            if (!cropId || !currentRole || !currentPhoneNumber || !db) return;

            if (confirm("Are you sure you want to delete this crop?")) {
                const tr = btn.closest('tr');
                if (tr) {
                    const originalHTML = btn.innerHTML;
                    btn.disabled = true;
                    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
                    try {
                        const cropRef = doc(db, `${currentRole}/${currentPhoneNumber}/crops/${cropId}`);

                        await deleteDoc(cropRef);

                        tr.remove(); // Remove row from table directly

                        // Check if list is empty (only the 'No crops' row left or completely empty)
                        if (myCropsListEl.children.length === 0 || (myCropsListEl.children.length === 1 && myCropsListEl.children[0].id === 'no-crops-row')) {
                            const noCropsRow = document.getElementById('no-crops-row');
                            if (noCropsRow) noCropsRow.style.display = 'table-row';

                            // Re-update the dashboard visually back to zero state
                            const dashCropName = document.getElementById('dashboard-crop-name');
                            const dashCropLoc = document.getElementById('dashboard-crop-location');
                            if (dashCropName) dashCropName.textContent = '0 Lots';
                            if (dashCropLoc) {
                                dashCropLoc.textContent = 'Add crops to track';
                                dashCropLoc.classList.remove('up');
                                dashCropLoc.classList.add('neutral');
                            }
                        } else {
                            // Fetch again to sync the specific counts cleanly
                            fetchUserCrops();
                        }
                    } catch (err) {
                        console.error("Failed to delete crop: ", err);
                        alert("There was an error deleting this crop from cloud. Please try again.");
                        btn.disabled = false;
                        btn.innerHTML = originalHTML;
                    }
                }
            }
        });
    }
});
