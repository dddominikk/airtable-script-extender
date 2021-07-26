let rec = { fields: {} },
    FieldName = `ready`,//change this from 'ready' to the name of your checkbox field
    table = base.getTable(cursor.activeTableId),
    record = await input.recordAsync('', table)
        .then(
            record => {
                rec.id = record.id,
                    rec.fields[FieldName] = record.getCellValue(FieldName) 
                    ? false
                    : true
                return rec
            }
        )
        .then(
            () => table.updateRecordAsync(rec.id, rec.fields)
        )
