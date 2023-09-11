/*********************************ATTENTION************************************
 * 1.如欲使用随机数据点，请点击“Start with random data”；
 * 2.如欲使用外部数据集，请点击“选择文件”，在DataSets文件夹中提供6个数据集可供选择，
 *   要求：二维，csv文件；
 * 3.重新开始请刷新页面；
 * Last but Most Important: 不要让绵羊追上鼠标！当绵羊在鼠标下时，无法点击按钮！
 ******************************************************************************/

/********************************在此修改参数***********************************/
var max_loop = 100;         //最大迭代次数
var K = 4;                  //聚类中心数2~5
var color = ["#dd001b", 
    "#fcc629", "#ca64ea", 
    "#269645", "#1E6FFF", 
    "#49d590"];             //点色，第一个是聚类中心的颜色
var drawDelay = "2000";     //延迟
/*******************************************************************************/

var data = [];              //数据集
var means = [];             //聚类中心
var assignments = [];       //划分
var dataExtremes;           //极值
var loop_count = 0;         //迭代计数

var canvas = document.getElementById('mycanvas'); //画布
canvas.width = "1200";                            //画布宽
canvas.height = "600";                            //画布高

var file = document.querySelector('input');       //文件输入


function getRandomData(n = 500, max_w = 1190, max_h = 590) {
    //生成数据点（随机）

    for(let i = 0; i < n; ++i) {
        data[i] = [Math.random()*max_w, Math.random()*max_h];
        // console.log(data[i]);
    }
}

function getDataRanges(extremes) {  
    //获得每一维度方向上的数据跨度。

    var ranges = [];

    for (var dimension in extremes) {
        ranges[dimension] = extremes[dimension].max - extremes[dimension].min;
    }

    return ranges;
}

function getDataExtremes(data) {
    //遍历每一个数据点，并找到每一维度上的最大、最小值。

    var extremes = [];

    for (var i in data) { //对于每一个点

        var point = data[i]; 

        for (var dimension in point) { //对于该点的每一维度

            if ( ! extremes[dimension] ) { //如果该点最大最小值不存在，则初始化为
                extremes[dimension] = {min: 10000, max: 0};
            }

            if (point[dimension] < extremes[dimension].min) { //迭代找到最小值
                extremes[dimension].min = point[dimension];
            }

            if (point[dimension] > extremes[dimension].max) { //迭代找到最大值
                extremes[dimension].max = point[dimension];
            }
        }
    }

    return extremes; //返回[{}, {}, ..., {}]
}

function initMeans(k) {
    //随机生成聚类中心（在dataRange范围内）

    //限制k在2~5之间
    if (k < 2 || k > 5){
        k = 4;
    }

    while (k--){
        var mean = []; //mean将是一个聚类中心

        for (var dimension in dataExtremes){
            mean[dimension] = dataExtremes[dimension].min + ( Math.random() * dataRange[dimension] );
        }
        means.push(mean); //means是聚类中心集合，包含k个聚类中心
    }

    return means;
}

function makeAssignments() {
    //对每个点计算到所有聚类中心的距离并将其划分到距离最近的簇

    for (var i in data) { //对数据中的每个点

        var point = data[i];
        var distances = [];

        for (var j in means) { //对means里的每一个mean（聚类中心）

            var mean = means[j];
            var sum = 0;

            for (var dimension in point) { //对该点的每个维度
            
                var difference = point[dimension] - mean[dimension]; //差
                difference *= difference; //差的平方
                sum += difference; //差的平方和
            }

            distances[j] = Math.sqrt(sum); //该点到每个聚类中心的欧氏距离
        }

        assignments[i] = distances.indexOf( Math.min.apply(null, distances) ); //获得距离该点最近的聚类中心号
    }
}

function moveMeans() {
    //更新聚类中心，并判断是否移动

    makeAssignments();

    var sums = Array( means.length );
    var counts = Array( means.length );
    var moved = false;

    //初始化sums和counts数组
    for (var j in means) {
        counts[j] = 0;
        sums[j] = Array( means[j].length ); //我们处理的是每个簇中的每个点在每个维度上的数据
        for (var dimension in means[j]){
            sums[j][dimension] = 0;
        }
    }

    //计算每个维度上每个簇中各点之和
    for (var point_index in assignments) { //对于每个点
    
        var mean_index = assignments[point_index]; ///该点所属于的簇号
        var point = data[point_index]; //该点
        var mean = means[mean_index]; //该点所属于的簇的聚类中心

        counts[mean_index]++; //统计每个簇中点的个数

        for (var dimension in mean) {
            sums[mean_index][dimension] += point[dimension];
        }
    }

    for (var mean_index in sums) { //对于每一个簇
    
        console.log("簇%d共有%d点", mean_index, counts[mean_index]); //打印簇中点数

        if ( 0 === counts[mean_index]) { //如果簇中点数为0
        
            sums[mean_index] = means[mean_index]; 
            console.log("Mean with no points"); 
            console.log(sums[mean_index]); 

            //随机再选一个聚类中心
            for (var dimension in dataExtremes) {
                sums[mean_index][dimension] = dataExtremes[dimension].min + ( Math.random() * dataRange[dimension] );
            }
            continue;
        }

        //用均值更新聚类中心，暂时放在sums中
        for (var dimension in sums[mean_index]){
            sums[mean_index][dimension] /= counts[mean_index];
        }
    }

    //判断聚类中心是否有移动
    if (means.toString() !== sums.toString()) {
        moved = true;
    }

    means = sums; //正式更新聚类中心

    return moved;
}


function draw_means(color_index = 0) {
    //绘制聚类中心

    let x, y;
    var ctx_mean = canvas.getContext("2d");
    ctx_mean.globalAlpha = 0.8; //为避免点覆盖，采取半透明绘制
    ctx_mean.fillStyle=color[color_index];
    for(let i in means) {
        x = means[i][0];
        y = means[i][1];
        ctx_mean.beginPath();
        ctx_mean.arc(x, y , 5 , 0 , 2*Math.PI,false);
        ctx_mean.closePath();
        ctx_mean.fill();
    }
}


function draw_points(color_index_means = 0) {
    //绘制点

    canvas.width=canvas.width; //清空画布

    let x, y;
    var ctx = canvas.getContext("2d");
    ctx.globalAlpha = 0.7; //为避免点覆盖，采取半透明绘制
    
    //绘制点
    ctx.fillStyle=color[color_index_means];
    for(let i in data) {
        point = data[i];
        x = point[0];
        y = point[1];
        // console.log("该点聚为第%d类", assignments[i]);
        ctx.fillStyle=color[assignments[i]+1];
        ctx.beginPath();
        ctx.arc(x, y , 3 , 0 , 2*Math.PI,false);
        ctx.closePath();
        ctx.fill();
    }

    //绘制聚类中心
    ctx.fillStyle=color[color_index_means];
    for(let i in means) {
        x = means[i][0];
        y = means[i][1];
        ctx.beginPath();
        ctx.arc(x, y , 5 , 0 , 2*Math.PI,false);
        ctx.closePath();
        ctx.fill();
    }
}

function max_data (arr) {
    //二维数组每维最大值

    var arr_x = [];
    var arr_y = [];
    for(let i in arr) {
        arr_x.push(arr[i][0]);
        arr_y.push(arr[i][1]);
    }

    return [Math.max.apply(null, arr_x), Math.max.apply(null, arr_y)];
}

function min_data (arr) {
    //二维数组每维最小值

    var arr_x = [];
    var arr_y = [];
    for(let i in arr) {
        arr_x.push(arr[i][0]);
        arr_y.push(arr[i][1]);
    }

    return [Math.min.apply(null, arr_x), Math.min.apply(null, arr_y)];
}

function setup(clusters) {

    dataExtremes = getDataExtremes(data);
    dataRange = getDataRanges(dataExtremes);
    //生成聚类中心
    means = initMeans(clusters);
    //画点
    draw_points(5);
    draw_means(0);
    //首次划分
    makeAssignments();
    //延时后run
    setTimeout(run, drawDelay);

}

function run() {

    loop_count++;
    draw_points();
    var moved = moveMeans();

    //如果聚类中心发生了变化，就继续run，否则聚类完成
    if(loop_count > max_loop){
        alert("达到最大迭代次数，点击确定，聚类终止！(共迭代" + loop_count + "次)");
    }
    else if (moved) {
        setTimeout(run, drawDelay);
    }
    else {
        alert("收敛，点击确定，聚类终止！(共迭代" + loop_count + "次)");
    }
}


data_button.onmousedown = function() {
    //点击生成随机数据并开始聚类

    //每次点击重置
    loop_count = 0;
    data = [];
    means = [];
    assignments = [];
    canvas.width=canvas.width; //清空画布

    getRandomData();

    //开始
    setup(clusters = K);
}


file.onchange = function() {
    //点击选择文件，处理数据，并开始聚类

    //每次点击重置
    loop_count = 0;
    data = [];
    means = [];
    assignments = [];
    canvas.width=canvas.width; //清空画布

    //实例化FileReader对象
    var reader = new FileReader();
    reader.readAsText(this.files[0]);

    //加载成功，进行处理，并开始
    reader.onload = function() {
        data = this.result.split('\r\n');
        for(var i in data) {
            let temp = data[i].split(',')
            data[i] = [Number(temp[0]), Number(temp[1])];
        }

        //数据规范化
        min = min_data(data);
        for(i in data) {
            for(j in data[i]) {
                data[i][j] = data[i][j] - min[j] + 1;
            }
        }
        max = max_data(data);
        for(i in data) {
            data[i][0] *= 1190/max[0];
            data[i][1] *= 590/max[1];
        }

        //开始
        setup(clusters = K);
    }

    //加载中断
    reader.onabort = function() {
        //重置
        loop_count = 0;
        data = [];
        means = [];
        assignments = [];
    }
    
    //加载错误
    reader.onerror = function() {
        //重置
        loop_count = 0;
        data = [];
        means = [];
        assignments = [];
    }
}