import SyntaxHighlighter from 'react-syntax-highlighter';
import { Modal } from 'react-bootstrap';
import { useSliceSelector, useSliceStore } from '../utils/reduxHelper';

function isNumber(value) {
  value = value ?? '';
  if(value.trim() === '') return false;
  return !isNaN(Number(value));
}

function genField(field, generatedClasses){
  const fieldTypes = {
    INT: 'IntegerField',
    BOOL: 'BooleanField',
    BIGINT: 'BigIntegerField',
    FLOAT: 'FloatField',
    VARCHAR: 'CharField',
    TEXT: 'TextField',
    FILE: 'FileField',
    IMAGE: 'ImageField',
    DATE: 'DateField',
    DATETIME: 'DateTimeField',
    FOREIGN: 'ForeignKey',
    MANY_TO_MANY: 'ManyToManyField'
  };
  const fieldType = fieldTypes[field.type];
  let code = `${field.name} = models.${fieldType}(`;
  
  if(field.maxLength) {
    code += `max_length=${field.maxLength}, `
  }

  if(field.linkedTable){
    const foreignClass = field.linkedTable.substr(0,1).toUpperCase() + field.linkedTable.substr(1);
    const foreignClassGenerated = generatedClasses.includes(foreignClass);
    if(!foreignClassGenerated) code += "'";
    code += `${foreignClass}`;
    if(!foreignClassGenerated) code += "'";
    code += ", ";
  }

  if(field.blank) {
    code += `blank=True, `;
  }

  if(field.null) {
    code += `null=True, `;
  }

  if(field.unique) {
    code += `unique=True, `;
  }

  if(field.type === 'FOREIGN') {
    code += 'on_delete=models.PROTECT, ';
  }

  if(field.uploadTo) {
    code += `upload_to='${field.uploadTo}', `;
  }

  if(field.defaultValue) {
    code += `default=`;
    const isNum = isNumber(field.defaultValue);
    if(!isNum) code += "'";
    code += `${field.defaultValue}`;
    if(!isNum) code += "'";
    code += ", ";
  }

  if(code.substr(code.length-2) === ', ') {
    code = code.substr(0, code.length-2);
  }

  code += ')'

  return code;
}

function genClass(table, generatedClasses) {
  const className = table.name.substr(0,1).toUpperCase() + table.name.substr(1);
  let code = `class ${className}(models.Model):\n`
  table.fields.filter(field => field.name !== 'id').forEach(field => {
    code += '    ' + genField(field, generatedClasses) + '\n';
  });

  if(table.displayField){
    code += '\n';
    code += `    def __str__(self):\n`;
    code += `        return self.${table.displayField}\n`;
  }

  return code;
}

function genCode(tableList) {
  let code = `from django.db import models\n\n`;
  let generatedClasses = [];
  tableList.filter(table => !table.isLinkThrough).forEach(table => {
    code += genClass(table, generatedClasses) + '\n';
    generatedClasses.push(table.name.substr(0,1).toUpperCase() + table.name.substr(1));
  });

  return code;
}

export default function CodeModal() {
  const store = useSliceStore('app');
  const [showCodeModal, tableList] = useSliceSelector('app', ['showCodeModal', 'tableList']);


  function hide() {
    store.setState({
      showCodeModal: false
    });
  }

  let code = genCode(tableList ?? []);
  
  function copyToClipBoard(){
    navigator.clipboard.writeText(code);
  }

  return (
    <Modal size="xl" show={showCodeModal} onHide={hide}>
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