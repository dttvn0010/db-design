import SyntaxHighlighter from 'react-syntax-highlighter';
import { Modal } from 'react-bootstrap';
import { useSliceSelector, useSliceStore } from '../utils/reduxHelper';

function isValidCondition(condition) {
  const cond = condition.cond;
  const children = (condition.children ?? []).filter(isValidCondition);
  if(!cond) return false;

  if(cond === 'NOT'){
    if(children.length !== 1) {
      return false;
    }else{
      return isValidCondition(children[0]);
    }
  }

  if((cond === 'AND' || cond === 'OR')){
    if(children.length === 0){
      return false;
    }else{
      return children.every(isValidCondition);
    }
  }
  
  if(condition.fieldCustom) {
    return condition.expression;
  }else{
    return condition.tableName && condition.colName;
  }
}

function genCondition(targetTable, condition, indent) {
  if((condition.cond === 'AND' || condition.cond === 'OR') && condition.children) {
    let st = `(\n`;
    const children = condition.children.filter(isValidCondition);
    let symbol = {AND: '&', OR: '|'}[condition.cond];

    for(let i = 0; i < children.length; i++) {
      
      if(i === 0) st += indent + '    ';

      if(!['AND', 'OR', 'NOT'].includes(children[i].cond)) {
        st += "Q(";
      }

      st += genCondition(targetTable, children[i], indent + "    ");

      if(!['AND', 'OR', 'NOT'].includes(children[i].cond)) {
        st += ")";
      }

      if(i+1 < children.length) st += ` ${symbol}\n${indent}    `;
    }
    st += `\n${indent})`;
    return st;
  }

  if(condition.cond === 'NOT'){
    let st ='~Q';
    condition = condition.children[0];
    if(condition.cond !== 'AND' && condition.cond !== 'OR'){
      st += '(';
    }

    st += genCondition(targetTable, condition, indent + "    ");

    if(condition.cond !== 'AND' && condition.cond !== 'OR'){
      st += `)`;
    }
    return st;
  }

  let value = condition.value ?? '';
  
  let ops = {
    EQ: '',
    LT: '__lt',
    LTE: '__lte',
    GT: '__gt',
    GTE: '__gte',
    IS: '__is',
    IN: '__in',
    CT: '__icontains',
    SW: '__istartswith',
    EW: '__iendswith'
  }
  
  if(ops[condition.cond] !== undefined){
    if(condition.tableName !== targetTable) {
      return `${condition.tableName}__${condition.colName}${ops[condition.cond]}=${value}`
    }else{
      return `${condition.colName}${ops[condition.cond]}=${value}`
    }
  }

  return `${condition.cond}`;
}

function genQuery(targetTable, conditionList) {
  let className = targetTable.substr(0,1).toUpperCase() + targetTable.substr(1);
  let query = 'from django.db.models import Q\n\n';
  query += `${targetTable}_list = ${className}.objects.all()\n`;
  conditionList.forEach(condition => {
    query += `${targetTable}_list = ${targetTable}_list.filter(${genCondition(targetTable, condition, "")})\n`
  });
  return query;
}

export default function CodeModal() {
  const store = useSliceStore('app');
  const [showQueryCodeModal, targetTable, conditionList] = useSliceSelector('app', 
        ['showQueryCodeModal', 'targetTable', 'conditionList']);


  function hide() {
    store.setState({
      showQueryCodeModal: false
    });
  }

  let code = genQuery(targetTable ?? '', conditionList ?? []);
  
  function copyToClipBoard(){
    navigator.clipboard.writeText(code);
  }

  return (
    <Modal size="xl" show={showQueryCodeModal} onHide={hide}>
      <Modal.Header closeButton>
        <Modal.Title>
          Generated models
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div>
          <button className="btn btn-success btn-sm"
            onClick={copyToClipBoard}
          >
            <i className="fas fa-copy"></i> Copy to clipboard
          </button>
        </div>
        <SyntaxHighlighter language="python" className="mt-3">
          {code}
        </SyntaxHighlighter>
      </Modal.Body>
      <Modal.Footer>
        <button className="btn btn-secondary" onClick={hide}>
          Close
        </button>
      </Modal.Footer>
    </Modal>
  )
}