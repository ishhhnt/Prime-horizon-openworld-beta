import * as THREE from 'three';
import { playUiSelect } from './sound.js';

// city.js - Manages the three selectable city districts

export const NETWORK_1 = {
    pitch: 150,
    N: 4,
    roadWidth: 48,
    lane: 12,
    parkOffset: 18,
    extent: 600
};

export const NETWORK_2 = {
    pitch: 150,
    N: 12,
    roadWidth: 48,
    lane: 12,
    parkOffset: 18,
    extent: 1800
};

export const NETWORK_3 = {
    pitch: 150,
    N: 12,
    roadWidth: 48,
    lane: 12,
    parkOffset: 18,
    extent: 1800
};

export function createCityManager({ scene, renderer, shadowMeshes, houses, groundTexture, getShadows, onCityChange, city1Group }) {
    let activeCity = '1';
    let busy = false;
    let city1Houses = [...houses];
    
    let city2Group = null;
    let city2Houses = [];
    let city2Loaded = false;
    let city3Group = null;
    let city3Houses = [];
    let city3Loaded = false;

    const statusEl = document.getElementById('city-status');
    const setStatus = (msg) => { if (statusEl) statusEl.innerText = msg; };

    function buildCity2(callback) {
        busy = true;
        setStatus('GENERATING CITY 2 (MEGA CITY)...');

        city2Group = new THREE.Group();
        scene.add(city2Group);

        const texLoader = new THREE.TextureLoader();
        const roadWidth = 48;
        const blockSize = 150;
        const gridSize = 12; // 24x24 blocks
        const roadHeight = 1.5;

        // Load Road Textures
        const vTex = texLoader.load('road/1.png', (tex) => {
            tex.wrapS = THREE.RepeatWrapping; tex.wrapT = THREE.RepeatWrapping;
            tex.colorSpace = THREE.SRGBColorSpace;
        });
        const hTex = texLoader.load('road/2.png', (tex) => {
            tex.wrapS = THREE.RepeatWrapping; tex.wrapT = THREE.RepeatWrapping;
            tex.colorSpace = THREE.SRGBColorSpace;
        });

        const roadLen = blockSize * gridSize * 2;
        hTex.repeat.set(roadLen / 38, 1);
        const hRoadGeo = new THREE.PlaneGeometry(roadLen, roadWidth);
        const hRoadMat = new THREE.MeshStandardMaterial({ map: hTex, roughness: 0.85, metalness: 0.08 });

        for (let i = -gridSize; i <= gridSize; i++) {
            const road = new THREE.Mesh(hRoadGeo, hRoadMat);
            road.rotation.x = -Math.PI / 2;
            road.position.set(0, roadHeight, i * blockSize);
            road.receiveShadow = getShadows ? getShadows() : false;
            city2Group.add(road);
            if (shadowMeshes) shadowMeshes.push(road);
        }

        const segLen = blockSize - roadWidth;
        vTex.repeat.set(1, segLen / 38);
        const vRoadGeo = new THREE.PlaneGeometry(roadWidth, segLen);
        const vRoadMat = new THREE.MeshStandardMaterial({ map: vTex, roughness: 0.85, metalness: 0.08 });

        for (let i = -gridSize; i <= gridSize; i++) {
            for (let j = -gridSize; j < gridSize; j++) {
                const road = new THREE.Mesh(vRoadGeo, vRoadMat);
                road.rotation.x = -Math.PI / 2;
                road.position.set(i * blockSize, roadHeight, j * blockSize + blockSize / 2);
                road.receiveShadow = getShadows ? getShadows() : false;
                city2Group.add(road);
                if (shadowMeshes) shadowMeshes.push(road);
            }
        }

        const city2Textures = [];
        let texLoadedCount = 0;
        for (let k = 1; k <= 5; k++) {
            texLoader.load(`city2/${k}.png`, (t) => {
                t.colorSpace = THREE.SRGBColorSpace;
                city2Textures.push(t);
                texLoadedCount++;
                if (texLoadedCount === 5) populateBuildings();
            }, undefined, () => {
                texLoadedCount++;
                if (texLoadedCount === 5) populateBuildings();
            });
        }

        function populateBuildings() {
            const buildingWidth = 72, buildingDepth = 72;
            const plotSize = blockSize - roadWidth - 2;
            const groundGeo = new THREE.PlaneGeometry(plotSize, plotSize);
            const groundMat = new THREE.MeshStandardMaterial({ map: groundTexture, roughness: 0.9, metalness: 0.05 });
            const roofMat = new THREE.MeshStandardMaterial({ color: 0x222428, roughness: 0.8 });
            const bottomMat = new THREE.MeshStandardMaterial({ color: 0x111111 });

            const mats = city2Textures.map(t => new THREE.MeshStandardMaterial({ map: t, roughness: 0.55, metalness: 0.15 }));
            const fallbackMat = new THREE.MeshStandardMaterial({ color: 0x444455 });

            for (let i = -gridSize; i < gridSize; i++) {
                for (let j = -gridSize; j < gridSize; j++) {
                    const x = i * blockSize + blockSize / 2;
                    const z = j * blockSize + blockSize / 2;

                    const groundMesh = new THREE.Mesh(groundGeo, groundMat);
                    groundMesh.rotation.x = -Math.PI / 2;
                    groundMesh.position.set(x, 1.51, z);
                    groundMesh.receiveShadow = getShadows ? getShadows() : false;
                    city2Group.add(groundMesh);

                    if (Math.random() > 0.65) continue;

                    const heightMul = 0.8 + Math.random() * 1.5;
                    const bHeight = 48 * heightMul;
                    const getMat = () => mats.length > 0 ? mats[Math.floor(Math.random() * mats.length)] : fallbackMat;
                    const bMaterials = [getMat(), getMat(), roofMat, bottomMat, getMat(), getMat()];

                    const buildingMesh = new THREE.Mesh(new THREE.BoxGeometry(buildingWidth, bHeight, buildingDepth), bMaterials);
                    buildingMesh.position.set(x, bHeight / 2 + 1.5, z);
                    buildingMesh.userData.width = buildingWidth;
                    buildingMesh.userData.depth = buildingDepth;
                    buildingMesh.userData.isBuilding = true;
                    buildingMesh.castShadow = getShadows ? getShadows() : false;
                    buildingMesh.receiveShadow = getShadows ? getShadows() : false;

                    city2Group.add(buildingMesh);
                    city2Houses.push(buildingMesh);
                    if (shadowMeshes) shadowMeshes.push(buildingMesh);
                }
            }

            city2Loaded = true;
            busy = false;
            setStatus('CITY 2 READY');
            if (callback) callback();
        }
    }

    function buildCity3(callback) {
        busy = true;
        setStatus('GENERATING CITY 3 ATLAS DISTRICT...');

        city3Group = new THREE.Group();
        city3Group.visible = false;
        scene.add(city3Group);

        const texLoader = new THREE.TextureLoader();
        const roadWidth = 48;
        const blockSize = 150;
        const gridSize = 12;
        const roadHeight = 1.5;

        const vTex = texLoader.load('road/1.png', (tex) => {
            tex.wrapS = THREE.RepeatWrapping; tex.wrapT = THREE.RepeatWrapping;
            tex.colorSpace = THREE.SRGBColorSpace;
        });
        const hTex = texLoader.load('road/2.png', (tex) => {
            tex.wrapS = THREE.RepeatWrapping; tex.wrapT = THREE.RepeatWrapping;
            tex.colorSpace = THREE.SRGBColorSpace;
        });

        const roadLen = blockSize * gridSize * 2;
        hTex.repeat.set(roadLen / 38, 1);
        const hRoadGeo = new THREE.PlaneGeometry(roadLen, roadWidth);
        const hRoadMat = new THREE.MeshStandardMaterial({ map: hTex, roughness: 0.85, metalness: 0.08 });

        for (let i = -gridSize; i <= gridSize; i++) {
            const road = new THREE.Mesh(hRoadGeo, hRoadMat);
            road.rotation.x = -Math.PI / 2;
            road.position.set(0, roadHeight, i * blockSize);
            road.receiveShadow = getShadows ? getShadows() : false;
            city3Group.add(road);
            if (shadowMeshes) shadowMeshes.push(road);
        }

        const segLen = blockSize - roadWidth;
        vTex.repeat.set(1, segLen / 38);
        const vRoadGeo = new THREE.PlaneGeometry(roadWidth, segLen);
        const vRoadMat = new THREE.MeshStandardMaterial({ map: vTex, roughness: 0.85, metalness: 0.08 });

        for (let i = -gridSize; i <= gridSize; i++) {
            for (let j = -gridSize; j < gridSize; j++) {
                const road = new THREE.Mesh(vRoadGeo, vRoadMat);
                road.rotation.x = -Math.PI / 2;
                road.position.set(i * blockSize, roadHeight, j * blockSize + blockSize / 2);
                road.receiveShadow = getShadows ? getShadows() : false;
                city3Group.add(road);
                if (shadowMeshes) shadowMeshes.push(road);
            }
        }

        texLoader.load('city3/1.png', (atlas) => {
            atlas.colorSpace = THREE.SRGBColorSpace;
            populateBuildings(atlas);
        }, undefined, (error) => {
            console.error('Unable to load City 3 building atlas:', error);
            populateBuildings(null);
            setStatus('CITY 3 ATLAS TEXTURE UNAVAILABLE');
        });

        function createFacadeTextures(atlas) {
            if (!atlas || !atlas.image) return [];
            const image = atlas.image;
            const columns = 5, rows = 3, textures = [];
            for (let row = 0; row < rows; row++) {
                for (let col = 0; col < columns; col++) {
                    const canvas = document.createElement('canvas');
                    canvas.width = Math.floor(image.width / columns);
                    canvas.height = Math.floor(image.height / rows);
                    const ctx = canvas.getContext('2d');
                    if (!ctx) {
                        console.error('Unable to create City 3 façade canvas context.');
                        return [];
                    }
                    const sx = col * image.width / columns;
                    const sy = row * image.height / rows;
                    ctx.drawImage(image, sx, sy, image.width / columns, image.height / rows,
                        0, 0, canvas.width, canvas.height);
                    const texture = new THREE.CanvasTexture(canvas);
                    texture.colorSpace = THREE.SRGBColorSpace;
                    texture.anisotropy = renderer && renderer.capabilities
                        ? renderer.capabilities.getMaxAnisotropy()
                        : 1;
                    textures.push(texture);
                }
            }
            return textures;
        }

        function populateBuildings(atlas) {
            const facades = createFacadeTextures(atlas);
            const fallbackMat = new THREE.MeshStandardMaterial({ color: 0x777777, roughness: 0.8 });
            const plotSize = blockSize - roadWidth - 2;
            const groundGeo = new THREE.PlaneGeometry(plotSize, plotSize);
            const groundMat = new THREE.MeshStandardMaterial({ map: groundTexture, roughness: 0.9, metalness: 0.05 });
            const facadeMaterials = facades.map(texture =>
                new THREE.MeshStandardMaterial({ map: texture, roughness: 0.68, metalness: 0.08 })
            );
            const roofMaterials = [
                new THREE.MeshStandardMaterial({ color: 0x26292d, roughness: 0.8 }),
                new THREE.MeshStandardMaterial({ color: 0x3b342e, roughness: 0.82 }),
                new THREE.MeshStandardMaterial({ color: 0x343b40, roughness: 0.78 })
            ];
            const bottomMat = new THREE.MeshStandardMaterial({ color: 0x17191b, roughness: 0.9 });
            const facadeDeck = [];
            let buildingIndex = 0;
            const nextFacade = () => {
                if (!facadeDeck.length) {
                    facadeDeck.push(...facades.map((_, index) => index));
                    for (let i = facadeDeck.length - 1; i > 0; i--) {
                        const j = Math.floor(Math.random() * (i + 1));
                        [facadeDeck[i], facadeDeck[j]] = [facadeDeck[j], facadeDeck[i]];
                    }
                }
                return facadeDeck.pop();
            };

            for (let i = -gridSize; i < gridSize; i++) {
                for (let j = -gridSize; j < gridSize; j++) {
                    const x = i * blockSize + blockSize / 2;
                    const z = j * blockSize + blockSize / 2;
                    const ground = new THREE.Mesh(groundGeo, groundMat);
                    ground.rotation.x = -Math.PI / 2;
                    ground.position.set(x, 1.51, z);
                    ground.receiveShadow = getShadows ? getShadows() : false;
                    city3Group.add(ground);

                    const width = 54 + Math.random() * 25;
                    const depth = 48 + Math.random() * 24;
                    const levels = 3 + Math.floor(Math.random() * 8);
                    const height = 13 + levels * (5.5 + Math.random() * 1.2);
                    const frontIndex = nextFacade();
                    const sideIndex = facades.length ? (frontIndex + 5) % facades.length : -1;
                    const backIndex = facades.length ? (frontIndex + 10) % facades.length : -1;
                    const getFacade = index => facadeMaterials[index] || fallbackMat;
                    const materials = [
                        getFacade(sideIndex),
                        getFacade(sideIndex),
                        roofMaterials[buildingIndex % roofMaterials.length],
                        bottomMat,
                        getFacade(frontIndex),
                        getFacade(backIndex)
                    ];
                    const building = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), materials);
                    building.position.set(x, height / 2 + 1.5, z);
                    building.rotation.y = Math.floor(Math.random() * 4) * Math.PI / 2;
                    building.userData.width = width;
                    building.userData.depth = depth;
                    building.userData.isBuilding = true;
                    building.castShadow = getShadows ? getShadows() : false;
                    building.receiveShadow = getShadows ? getShadows() : false;
                    city3Group.add(building);
                    city3Houses.push(building);
                    if (shadowMeshes) shadowMeshes.push(building);
                    buildingIndex++;
                }
            }

            city3Loaded = true;
            busy = false;
            if (facades.length) setStatus('CITY 3 ATLAS DISTRICT READY');
            else setStatus('CITY 3 READY · USING FALLBACK FACADES');
            if (callback) callback();
        }
    }

    function switchCity(cityId) {
        if (busy || (cityId !== '1' && cityId !== '2' && cityId !== '3')) return;
        activeCity = cityId;
        playUiSelect();

        document.querySelectorAll('.seg-btn[data-city], .district-btn[data-city]').forEach(b => {
            b.classList.toggle('active', b.dataset.city === cityId);
        });

        if (cityId === '1') {
            if (city2Group) city2Group.visible = false;
            if (city3Group) city3Group.visible = false;
            if (city1Group) city1Group.visible = true;
            houses.length = 0;
            houses.push(...city1Houses);
            setStatus('CITY 1 DOWNTOWN ACTIVE');
            if (onCityChange) onCityChange(NETWORK_1);
        } else if (cityId === '2') {
            if (city1Group) city1Group.visible = false;
            if (city3Group) city3Group.visible = false;
            if (!city2Loaded) {
                buildCity2(() => {
                    city2Group.visible = true;
                    houses.length = 0;
                    houses.push(...city2Houses);
                    if (onCityChange) onCityChange(NETWORK_2);
                });
            } else {
                city2Group.visible = true;
                houses.length = 0;
                houses.push(...city2Houses);
                setStatus('CITY 2 MEGA CITY ACTIVE');
                if (onCityChange) onCityChange(NETWORK_2);
            }
        } else if (cityId === '3') {
            if (city1Group) city1Group.visible = false;
            if (city2Group) city2Group.visible = false;
            if (!city3Loaded) {
                buildCity3(() => {
                    city3Group.visible = true;
                    houses.length = 0;
                    houses.push(...city3Houses);
                    if (onCityChange) onCityChange(NETWORK_3);
                });
            } else {
                city3Group.visible = true;
                houses.length = 0;
                houses.push(...city3Houses);
                setStatus('CITY 3 ATLAS DISTRICT ACTIVE');
                if (onCityChange) onCityChange(NETWORK_3);
            }
        }
    }

    // Attach button events
    document.querySelectorAll('.seg-btn[data-city], .district-btn[data-city]').forEach(btn => {
        btn.onclick = () => switchCity(btn.dataset.city);
    });

    return {
        isBusy: () => busy,
        get activeCity() { return activeCity; },
        switchCity,
        registerCity1Houses: (newHouses) => {
            city1Houses = [...newHouses];
        }
    };
}
