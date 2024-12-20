// DOM 元素
const newAlbumBtn = document.querySelector('.new-album-btn');
const uploadPhotosBtn = document.querySelector('.upload-photos-btn');
const newAlbumModal = document.getElementById('new-album-modal');
const uploadPhotosModal = document.getElementById('upload-photos-modal');
const photoPreviewModal = document.getElementById('photo-preview-modal');
const closeBtns = document.querySelectorAll('.close-btn');
const cancelBtns = document.querySelectorAll('.cancel-btn');
const albumForm = document.getElementById('album-form');
const uploadForm = document.getElementById('upload-form');
const searchInput = document.querySelector('.search-bar input');
const filterSelects = document.querySelectorAll('.filter-options select');
const albumsGrid = document.querySelector('.albums-grid');
const photosGrid = document.querySelector('.photos-grid');
const backToAlbumsBtn = document.querySelector('.back-to-albums');

// 数据存储
let albums = JSON.parse(localStorage.getItem('albums')) || [];
let currentAlbum = null;

// 打开模态框
function openModal(modal) {
    if (!modal) return;
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

// 关闭模态框
function closeModal(modal) {
    if (!modal) return;
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
    if (modal === newAlbumModal) {
        albumForm.reset();
        document.querySelector('.cover-preview').innerHTML = '';
    } else if (modal === uploadPhotosModal) {
        uploadForm.reset();
        document.querySelector('.upload-preview').innerHTML = '';
    }
}

// 事件监听器
document.addEventListener('DOMContentLoaded', () => {
    // 新建相册按钮
    if (newAlbumBtn) {
        newAlbumBtn.addEventListener('click', () => {
            openModal(newAlbumModal);
        });
    }

    // 上传照片按钮
    if (uploadPhotosBtn) {
        uploadPhotosBtn.addEventListener('click', () => {
            openModal(uploadPhotosModal);
        });
    }

    // 关闭按钮
    closeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const modal = btn.closest('.modal');
            closeModal(modal);
        });
    });

    // 取消按钮
    cancelBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const modal = btn.closest('.modal');
            closeModal(modal);
        });
    });

    // 点击模态框外部关闭
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            closeModal(e.target);
        }
    });

    // 初始化相册列表
    renderAlbums();
    
    // 更新上传表单的相册选项
    const albumSelect = uploadForm.querySelector('[name="album"]');
    if (albumSelect) {
        albumSelect.innerHTML = `
            <option value="">选择相册</option>
            <option value="new">创建新相册</option>
            ${albums.map(album => `
                <option value="${album.id}">${album.name}</option>
            `).join('')}
        `;
    }

    // 绑定返回相册列表按钮
    if (backToAlbumsBtn) {
        backToAlbumsBtn.addEventListener('click', () => {
            albumsGrid.style.display = 'grid';
            photosGrid.style.display = 'none';
            currentAlbum = null;
        });
    }

    // 绑定搜索和筛选事件
    if (searchInput) {
        searchInput.addEventListener('input', filterAlbums);
    }
    filterSelects.forEach(select => {
        if (select) {
            select.addEventListener('change', filterAlbums);
        }
    });
});

// 封面图片预览
const coverImage = document.getElementById('cover-image');
coverImage.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const preview = document.querySelector('.cover-preview');
            preview.innerHTML = `<img src="${e.target.result}" alt="封面预览">`;
        };
        reader.readAsDataURL(file);
    }
});

// 照片拖放上传
const uploadArea = document.querySelector('.upload-area');
const photoUpload = document.getElementById('photo-upload');

uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('dragover');
});

uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('dragover');
});

uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    const files = e.dataTransfer.files;
    handleFiles(files);
});

photoUpload.addEventListener('change', (e) => {
    handleFiles(e.target.files);
});

function handleFiles(files) {
    const preview = document.querySelector('.upload-preview');
    preview.innerHTML = '';
    
    Array.from(files).forEach(file => {
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const div = document.createElement('div');
                div.className = 'preview-item';
                div.innerHTML = `
                    <img src="${e.target.result}" alt="预览">
                    <button type="button" class="remove-btn">&times;</button>
                `;
                preview.appendChild(div);
                
                // 删除预览图片
                div.querySelector('.remove-btn').addEventListener('click', () => {
                    div.remove();
                });
            };
            reader.readAsDataURL(file);
        }
    });
}

// 创建新相册
albumForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const formData = new FormData(albumForm);
    const coverFile = coverImage.files[0];
    
    if (coverFile) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const newAlbum = {
                id: Date.now(),
                name: formData.get('name'),
                location: formData.get('location'),
                description: formData.get('description'),
                cover: e.target.result,
                photos: [],
                timestamp: new Date().toISOString()
            };
            
            albums.unshift(newAlbum);
            localStorage.setItem('albums', JSON.stringify(albums));
            
            renderAlbums();
            closeModal(newAlbumModal);
            showNotification('相册创建成功！', 'success');
        };
        reader.readAsDataURL(coverFile);
    }
});

// 上传照片
uploadForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const albumId = uploadForm.album.value;
    const files = photoUpload.files;
    
    if (files.length === 0) {
        showNotification('请选择要上传的照片', 'error');
        return;
    }
    
    const uploadedPhotos = [];
    for (const file of files) {
        if (file.type.startsWith('image/')) {
            const photoData = await readFileAsDataURL(file);
            uploadedPhotos.push({
                id: Date.now() + Math.random(),
                url: photoData,
                name: file.name,
                timestamp: new Date().toISOString()
            });
        }
    }
    
    if (albumId === 'new') {
        // 创建新相册并添加照片
        const newAlbum = {
            id: Date.now(),
            name: '新相册',
            cover: uploadedPhotos[0].url,
            photos: uploadedPhotos,
            timestamp: new Date().toISOString()
        };
        albums.unshift(newAlbum);
    } else {
        // 添加到现有相册
        const album = albums.find(a => a.id === parseInt(albumId));
        if (album) {
            album.photos.push(...uploadedPhotos);
        }
    }
    
    localStorage.setItem('albums', JSON.stringify(albums));
    renderAlbums();
    closeModal(uploadPhotosModal);
    showNotification('照片上传成功！', 'success');
});

// 读取文件为DataURL
function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(e);
        reader.readAsDataURL(file);
    });
}

// 渲染相册列表
function renderAlbums(filteredAlbums = albums) {
    albumsGrid.innerHTML = filteredAlbums.map(album => `
        <div class="album-card gradient-card" data-id="${album.id}">
            <div class="album-cover">
                <img src="${album.cover}" alt="${album.name}">
                <div class="album-overlay">
                    <span class="photo-count">
                        <i class="fas fa-image"></i> ${album.photos.length}
                    </span>
                    <div class="album-actions">
                        <button class="action-btn view-btn" title="查看" onclick="viewAlbum(${album.id})">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="action-btn edit-btn" title="编辑" onclick="editAlbum(${album.id})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn delete-btn" title="删除" onclick="deleteAlbum(${album.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
            <div class="album-info">
                <h3>${album.name}</h3>
                <p class="album-meta">
                    <span><i class="fas fa-calendar"></i> ${new Date(album.timestamp).toLocaleDateString()}</span>
                    ${album.location ? `<span><i class="fas fa-map-marker-alt"></i> ${album.location}</span>` : ''}
                </p>
            </div>
        </div>
    `).join('');
}

// 查看相册
function viewAlbum(albumId) {
    currentAlbum = albums.find(a => a.id === albumId);
    if (!currentAlbum) return;
    
    albumsGrid.style.display = 'none';
    photosGrid.style.display = 'block';
    
    const photosContainer = document.querySelector('.photos-container');
    photosContainer.innerHTML = currentAlbum.photos.map(photo => `
        <div class="photo-card" data-id="${photo.id}">
            <img src="${photo.url}" alt="${photo.name}">
            <div class="photo-overlay">
                <div class="photo-actions">
                    <button class="action-btn preview-btn" onclick="previewPhoto('${photo.id}')">
                        <i class="fas fa-expand"></i>
                    </button>
                    <button class="action-btn favorite-btn">
                        <i class="fas fa-heart"></i>
                    </button>
                    <button class="action-btn delete-btn" onclick="deletePhoto('${photo.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        </div>
    `).join('');
    
    document.querySelector('.photos-header h3').textContent = currentAlbum.name;
}

// 预览照片
function previewPhoto(photoId) {
    const photo = currentAlbum.photos.find(p => p.id === photoId);
    if (!photo) return;
    
    const previewImage = photoPreviewModal.querySelector('.photo-container img');
    previewImage.src = photo.url;
    
    openModal(photoPreviewModal);
}

// 编辑相册
function editAlbum(albumId) {
    const album = albums.find(a => a.id === albumId);
    if (!album) return;
    
    const form = document.getElementById('album-form');
    form.querySelector('[name="name"]').value = album.name;
    form.querySelector('[name="location"]').value = album.location || '';
    form.querySelector('[name="description"]').value = album.description || '';
    
    if (album.cover) {
        const preview = document.querySelector('.cover-preview');
        preview.innerHTML = `<img src="${album.cover}" alt="封面预览">`;
    }
    
    openModal(newAlbumModal);
    
    // 更新表单提交处理
    form.onsubmit = async (e) => {
        e.preventDefault();
        
        const formData = new FormData(form);
        const coverFile = coverImage.files[0];
        
        const updatedAlbum = {
            ...album,
            name: formData.get('name'),
            location: formData.get('location'),
            description: formData.get('description')
        };
        
        if (coverFile) {
            updatedAlbum.cover = await readFileAsDataURL(coverFile);
        }
        
        const index = albums.findIndex(a => a.id === albumId);
        albums[index] = updatedAlbum;
        
        localStorage.setItem('albums', JSON.stringify(albums));
        renderAlbums();
        closeModal(newAlbumModal);
        showNotification('相册更新成功！', 'success');
    };
}

// 删除相册
function deleteAlbum(albumId) {
    if (!confirm('确定要删除这个相册吗？相册中的所有照片都将被删除。')) return;
    
    albums = albums.filter(album => album.id !== albumId);
    localStorage.setItem('albums', JSON.stringify(albums));
    renderAlbums();
    showNotification('相册已删除', 'info');
}

// 删除照片
function deletePhoto(photoId) {
    if (!currentAlbum || !confirm('确定要删除这张照片吗？')) return;
    
    currentAlbum.photos = currentAlbum.photos.filter(photo => photo.id !== photoId);
    
    // 如果删除的是封面照片，更新封面
    if (currentAlbum.photos.length > 0 && currentAlbum.cover === photoId) {
        currentAlbum.cover = currentAlbum.photos[0].url;
    }
    
    const index = albums.findIndex(a => a.id === currentAlbum.id);
    albums[index] = currentAlbum;
    
    localStorage.setItem('albums', JSON.stringify(albums));
    viewAlbum(currentAlbum.id);
    showNotification('照片已删除', 'info');
}

// 搜索和筛选
searchInput.addEventListener('input', filterAlbums);
filterSelects.forEach(select => select.addEventListener('change', filterAlbums));

function filterAlbums() {
    const searchTerm = searchInput.value.toLowerCase();
    const albumType = filterSelects[0].value;
    const sortOrder = filterSelects[1].value;
    
    let filtered = albums.filter(album => {
        const matchesSearch = album.name.toLowerCase().includes(searchTerm) || 
                            (album.description && album.description.toLowerCase().includes(searchTerm)) ||
                            (album.location && album.location.toLowerCase().includes(searchTerm));
        
        if (albumType === 'recent') {
            return matchesSearch && (new Date(album.timestamp) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
        } else if (albumType === 'favorites') {
            return matchesSearch && album.favorite;
        }
        return matchesSearch;
    });
    
    // 排序
    filtered.sort((a, b) => {
        switch (sortOrder) {
            case 'date-asc':
                return new Date(a.timestamp) - new Date(b.timestamp);
            case 'name-asc':
                return a.name.localeCompare(b.name);
            case 'name-desc':
                return b.name.localeCompare(a.name);
            default: // date-desc
                return new Date(b.timestamp) - new Date(a.timestamp);
        }
    });
    
    renderAlbums(filtered);
}

// 通知提示
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        ${message}
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    renderAlbums();
    
    // 更新上传表单的相册选项
    const albumSelect = uploadForm.querySelector('[name="album"]');
    albumSelect.innerHTML = `
        <option value="">选择相册</option>
        <option value="new">创建新相册</option>
        ${albums.map(album => `
            <option value="${album.id}">${album.name}</option>
        `).join('')}
    `;
}); 