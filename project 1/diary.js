// DOM 元素
const newDiaryBtn = document.querySelector('.new-diary-btn');
const diaryModal = document.getElementById('diary-modal');
const closeBtn = document.querySelector('.close-btn');
const cancelBtn = document.querySelector('.cancel-btn');
const diaryForm = document.getElementById('diary-form');
const searchInput = document.querySelector('.search-bar input');
const filterSelects = document.querySelectorAll('.filter-options select');
const diaryGrid = document.querySelector('.diary-grid');
const pagination = document.querySelector('.pagination');

// 日记数据存储
let diaries = JSON.parse(localStorage.getItem('diaries')) || [];
let currentPage = 1;
const itemsPerPage = 9;

// 打开日记模态框
newDiaryBtn.addEventListener('click', () => {
    diaryModal.style.display = 'block';
    document.body.style.overflow = 'hidden';
});

// 关闭模态框
function closeModal() {
    diaryModal.style.display = 'none';
    document.body.style.overflow = 'auto';
    diaryForm.reset();
}

closeBtn.addEventListener('click', closeModal);
cancelBtn.addEventListener('click', closeModal);

// 点击模态框外部关闭
window.addEventListener('click', (e) => {
    if (e.target === diaryModal) {
        closeModal();
    }
});

// 表单提交处理
diaryForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const formData = new FormData(diaryForm);
    const newDiary = {
        id: Date.now(),
        title: formData.get('title'),
        content: formData.get('content'),
        mood: formData.get('mood'),
        weather: formData.get('weather'),
        timestamp: new Date().toISOString(),
        lastModified: new Date().toISOString()
    };
    
    diaries.unshift(newDiary);
    localStorage.setItem('diaries', JSON.stringify(diaries));
    
    renderDiaries();
    closeModal();
    
    // 显示成功提示
    showNotification('日记保存成功！', 'success');
});

// 渲染日记列表
function renderDiaries(filteredDiaries = diaries) {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedDiaries = filteredDiaries.slice(startIndex, endIndex);
    
    diaryGrid.innerHTML = paginatedDiaries.map(diary => `
        <div class="diary-card gradient-card" data-id="${diary.id}">
            <div class="card-header">
                <time>${new Date(diary.timestamp).toLocaleDateString()}</time>
                <div class="card-tags">
                    ${diary.mood ? `<span class="mood-tag ${diary.mood} gradient-tag">${getMoodText(diary.mood)}</span>` : ''}
                    ${diary.weather ? `<span class="weather-tag ${diary.weather} gradient-tag">${getWeatherText(diary.weather)}</span>` : ''}
                </div>
            </div>
            <div class="card-content">
                <h3>${diary.title}</h3>
                <p>${diary.content}</p>
            </div>
            <div class="card-footer">
                <button class="gradient-btn-small edit-btn" onclick="editDiary(${diary.id})">
                    <i class="fas fa-edit"></i> 编辑
                </button>
                <button class="gradient-btn-small delete-btn" onclick="deleteDiary(${diary.id})">
                    <i class="fas fa-trash"></i> 删除
                </button>
            </div>
        </div>
    `).join('');
    
    renderPagination(filteredDiaries.length);
}

// 渲染分页
function renderPagination(totalItems) {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    
    let paginationHTML = `
        <button class="gradient-btn-small" ${currentPage === 1 ? 'disabled' : ''} onclick="changePage(${currentPage - 1})">
            <i class="fas fa-chevron-left"></i>
        </button>
    `;
    
    for (let i = 1; i <= totalPages; i++) {
        paginationHTML += `
            <span class="page-number ${currentPage === i ? 'active' : ''}" onclick="changePage(${i})">${i}</span>
        `;
    }
    
    paginationHTML += `
        <button class="gradient-btn-small" ${currentPage === totalPages ? 'disabled' : ''} onclick="changePage(${currentPage + 1})">
            <i class="fas fa-chevron-right"></i>
        </button>
    `;
    
    pagination.innerHTML = paginationHTML;
}

// 切换页面
function changePage(page) {
    if (page < 1 || page > Math.ceil(diaries.length / itemsPerPage)) return;
    currentPage = page;
    renderDiaries();
}

// 搜索和筛选
searchInput.addEventListener('input', filterDiaries);
filterSelects.forEach(select => select.addEventListener('change', filterDiaries));

function filterDiaries() {
    const searchTerm = searchInput.value.toLowerCase();
    const moodFilter = filterSelects[0].value;
    const weatherFilter = filterSelects[1].value;
    const sortOrder = filterSelects[2].value;
    
    let filtered = diaries.filter(diary => {
        const matchesSearch = diary.title.toLowerCase().includes(searchTerm) || 
                            diary.content.toLowerCase().includes(searchTerm);
        const matchesMood = !moodFilter || diary.mood === moodFilter;
        const matchesWeather = !weatherFilter || diary.weather === weatherFilter;
        
        return matchesSearch && matchesMood && matchesWeather;
    });
    
    // 排序
    filtered.sort((a, b) => {
        const dateA = new Date(a.timestamp);
        const dateB = new Date(b.timestamp);
        return sortOrder === 'oldest' ? dateA - dateB : dateB - dateA;
    });
    
    currentPage = 1;
    renderDiaries(filtered);
}

// 编辑日记
function editDiary(id) {
    const diary = diaries.find(d => d.id === id);
    if (!diary) return;
    
    // 填充表单
    const form = document.getElementById('diary-form');
    form.querySelector('[name="title"]').value = diary.title;
    form.querySelector('[name="content"]').value = diary.content;
    form.querySelector('[name="mood"]').value = diary.mood;
    form.querySelector('[name="weather"]').value = diary.weather;
    
    // 打开模态框
    diaryModal.style.display = 'block';
    document.body.style.overflow = 'hidden';
    
    // 更新表单提交处理
    form.onsubmit = (e) => {
        e.preventDefault();
        
        const formData = new FormData(form);
        const index = diaries.findIndex(d => d.id === id);
        
        diaries[index] = {
            ...diary,
            title: formData.get('title'),
            content: formData.get('content'),
            mood: formData.get('mood'),
            weather: formData.get('weather'),
            lastModified: new Date().toISOString()
        };
        
        localStorage.setItem('diaries', JSON.stringify(diaries));
        renderDiaries();
        closeModal();
        showNotification('日记更新成功！', 'success');
    };
}

// 删除日记
function deleteDiary(id) {
    if (!confirm('确定要删除这篇日记吗？')) return;
    
    diaries = diaries.filter(diary => diary.id !== id);
    localStorage.setItem('diaries', JSON.stringify(diaries));
    renderDiaries();
    showNotification('日记已删除', 'info');
}

// 辅助函数
function getMoodText(mood) {
    const moodMap = {
        'happy': '开心',
        'normal': '一般',
        'sad': '难过'
    };
    return moodMap[mood] || mood;
}

function getWeatherText(weather) {
    const weatherMap = {
        'sunny': '晴天',
        'cloudy': '多云',
        'rainy': '下雨'
    };
    return weatherMap[weather] || weather;
}

// 通知提示
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'info-circle'}"></i>
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
    renderDiaries();
}); 