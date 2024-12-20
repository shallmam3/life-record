// DOM 元素
const quickRecordBtns = document.querySelectorAll('.record-btn');
const modals = document.querySelectorAll('.modal');
const closeBtns = document.querySelectorAll('.close-btn');
const forms = document.querySelectorAll('form');

// 记录数据存储
let records = {
    diary: [],
    photos: [],
    goals: [],
    moods: []
};

// 打开对应的模态框
quickRecordBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const type = btn.dataset.type;
        const modal = document.getElementById(`quick-${type}-modal`);
        if (modal) {
            modal.style.display = 'block';
            document.body.style.overflow = 'hidden';
        }
    });
});

// 关闭模态框
closeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const modal = btn.closest('.modal');
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    });
});

// 点击模态框外部关闭
window.addEventListener('click', (e) => {
    modals.forEach(modal => {
        if (e.target === modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    });
});

// 表单提交处理
forms.forEach(form => {
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const formType = form.id.split('-')[0];
        const formData = new FormData(form);
        const data = {};
        
        formData.forEach((value, key) => {
            data[key] = value;
        });
        
        // 添加时间戳
        data.timestamp = new Date().toISOString();
        
        // 存储数据
        records[formType].push(data);
        
        // 保存到本地存储
        localStorage.setItem('lifeRecords', JSON.stringify(records));
        
        // 更新显示
        updateRecordDisplay(formType);
        
        // 关闭模态框
        const modal = form.closest('.modal');
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
        
        // 重置表单
        form.reset();
    });
});

// 更新记录显示
function updateRecordDisplay(type) {
    const recordsContainer = document.querySelector('.records-grid');
    const record = records[type][records[type].length - 1];
    
    const recordCard = createRecordCard(type, record);
    recordsContainer.insertBefore(recordCard, recordsContainer.firstChild);
}

// 创建记录卡片
function createRecordCard(type, data) {
    const card = document.createElement('div');
    card.className = `record-card ${type}`;
    
    const date = new Date(data.timestamp).toLocaleDateString();
    
    let cardContent = '';
    switch(type) {
        case 'diary':
            cardContent = `
                <div class="card-header">
                    <i class="fas fa-book"></i>
                    <span>日记</span>
                    <time>${date}</time>
                </div>
                <div class="card-content">
                    <h3>${data.title}</h3>
                    <p>${data.content}</p>
                </div>
                <div class="card-footer">
                    <span class="mood-tag ${data.mood}">${data.mood}</span>
                    <span class="weather-tag ${data.weather}">${data.weather}</span>
                </div>
            `;
            break;
        case 'photo':
            cardContent = `
                <div class="card-header">
                    <i class="fas fa-image"></i>
                    <span>照片</span>
                    <time>${date}</time>
                </div>
                <div class="card-content">
                    <img src="${data.image}" alt="照片">
                    <p>${data.description}</p>
                </div>
                <div class="card-footer">
                    <span class="location-tag">${data.location}</span>
                </div>
            `;
            break;
        case 'goal':
            cardContent = `
                <div class="card-header">
                    <i class="fas fa-flag"></i>
                    <span>目标</span>
                    <time>${date}</time>
                </div>
                <div class="card-content">
                    <h3>${data.title}</h3>
                    <div class="progress-bar">
                        <div class="progress" style="width: ${data.progress}%;">${data.progress}%</div>
                    </div>
                </div>
                <div class="card-footer">
                    <span class="status-tag ${data.status}">${data.status}</span>
                </div>
            `;
            break;
    }
    
    card.innerHTML = cardContent;
    return card;
}

// 加载保存的数据
function loadSavedRecords() {
    const savedRecords = localStorage.getItem('lifeRecords');
    if (savedRecords) {
        records = JSON.parse(savedRecords);
        
        // 更新显示
        Object.keys(records).forEach(type => {
            records[type].forEach(record => {
                updateRecordDisplay(type);
            });
        });
    }
}

// 统计数据更新
function updateStatistics() {
    const stats = {
        totalDays: calculateTotalDays(),
        moodIndex: calculateMoodIndex(),
        completedGoals: calculateCompletedGoals()
    };
    
    // 更新显示
    document.querySelector('.stat-number:nth-child(1)').textContent = stats.totalDays;
    document.querySelector('.stat-number:nth-child(2)').textContent = stats.moodIndex.toFixed(1);
    document.querySelector('.stat-number:nth-child(3)').textContent = stats.completedGoals;
}

// 计算总天数
function calculateTotalDays() {
    const allDates = [];
    Object.values(records).forEach(recordType => {
        recordType.forEach(record => {
            const date = new Date(record.timestamp).toDateString();
            if (!allDates.includes(date)) {
                allDates.push(date);
            }
        });
    });
    return allDates.length;
}

// 计算心情指数
function calculateMoodIndex() {
    const moodScores = {
        'happy': 10,
        'normal': 7,
        'sad': 4
    };
    
    let total = 0;
    let count = 0;
    
    records.diary.forEach(diary => {
        if (diary.mood && moodScores[diary.mood]) {
            total += moodScores[diary.mood];
            count++;
        }
    });
    
    return count > 0 ? total / count : 0;
}

// 计算完成目标数
function calculateCompletedGoals() {
    return records.goals.filter(goal => goal.status === 'completed').length;
}

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', () => {
    loadSavedRecords();
    updateStatistics();
});

// 快速记录按钮点击事件
document.querySelectorAll('.record-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const type = btn.dataset.type;
        switch (type) {
            case 'diary':
                window.location.href = 'diary.html';
                break;
            case 'photo':
                window.location.href = 'photos.html';
                break;
            case 'mood':
                window.location.href = 'mood.html';
                break;
            case 'goal':
                window.location.href = 'goals.html';
                break;
        }
    });
}); 