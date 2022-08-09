
const colorList = [
  '#3366CC',
  '#DC3912',
  '#FF9900',
  '#109618',
  '#990099',
  '#3B3EAC',
  '#0099C6',
  '#DD4477',
  '#66AA00',
  '#B82E2E',
  '#316395',
  '#994499',
  '#22AA99',
  '#AAAA11',
  '#6633CC',
  '#E67300',
  '#8B0707',
  '#329262',
  '#5574A6',
  '#3B3EAC',
];

function clientToCanvas(rect, bound) {
  return {
    left: (rect.left - bound.left)/bound.width * 2000,
    right: (rect.right - bound.left)/bound.width * 2000,
    top: (rect.top - bound.top)/bound.height * 2000,
    bottom: (rect.bottom - bound.top)/bound.height * 2000,
  }
}

function drawLine(r1, r2, ctx, bound, color) {
  r1 = clientToCanvas(r1, bound);
  r2 = clientToCanvas(r2, bound);
  let x1 = [r1.left, r1.right];
  let x2 = [r2.left, r2.right]
  let i1min, i2min;
  let dmin = 1e6;

  for(let i1=0; i1 < 2; i1++){
    for(let i2=0; i2 < 2; i2++){
      let d = Math.abs(x1[i1] - x2[i2]);
      if(d < dmin) {
        dmin = d;
        i1min = i1;
        i2min = i2;
      }
    }
  }
  x1 = x1[i1min];
  x2 = x2[i2min];

  let x1_ = x1 + ((i1min === 0? -1:1) * 20);
  let x2_ = x2 + ((i2min === 0? -1:1) * 20);

  let y1 = (r1.top + r1.bottom)/2;
  let y2 = (r2.top + r2.bottom)/2;

  ctx.strokeStyle = color;
  ctx.beginPath();
  ctx.moveTo(x1, y1-5);
  ctx.lineTo((x1+x1_)/2, y1);
  ctx.moveTo(x1, y1+5);
  ctx.lineTo((x1+x1_)/2, y1);
  ctx.moveTo(x1, y1);
  ctx.lineTo(x1_, y1);
  ctx.lineTo(x2_, y2);
  ctx.lineTo(x2, y2);
  ctx.lineTo((x2+x2_)/2, y2-3);
  ctx.moveTo(x2, y2);
  ctx.lineTo((x2+x2_)/2, y2+3);
  ctx.stroke();
}

function getJoinList(tableList) {
  let joinList = [];
  tableList.forEach(table => {
    table.fields.forEach(field => {
      if(field.type === 'FOREIGN') {
        joinList.push({
          from: {
            tableName: table.name,
            fieldName: field.name
          },
          to:{
            tableName: field.linkedTable,
            fieldName: 'id'
          }
        })
      }
    });
  });
  return joinList;
}

export function drawLines(tableList) {
  const joinList = getJoinList(tableList);
  var canvas = document.getElementById("canvas");
  var ctx = canvas.getContext("2d");
  ctx.globalCompositeOperation='destination-over';
  ctx.lineWidth = 2;
  let bound = canvas.getBoundingClientRect();
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  let i = 0;
  joinList.forEach(join => {
    let rect1 = document.getElementById(`${join.from.tableName}.${join.from.fieldName}`)?.getBoundingClientRect();
    let rect2 = document.getElementById(`${join.to.tableName}.${join.to.fieldName}`)?.getBoundingClientRect();
    if(!rect1 || !rect2) return;
    drawLine(rect1, rect2, ctx, bound, colorList[i]);
    i = (i+1) % colorList.length;
  });
}