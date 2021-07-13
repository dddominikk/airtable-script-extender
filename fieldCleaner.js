	/* the bonus Easter Egg is so that TypeScript doesn't 

	 crash the app when a user changes their mind,

	 which happens often and seems amateurish on user end */



		let table = base.getTable('Slack Relay')

		await deletDisNephew();

		async function deletDisNephew(call){

           call = 'back'

        while(call==='back'){

        let record = await input.recordAsync(

          'Select a record whose Output you want to clear:',

           table, { 

             fields: ['Output','Word Count']

             }).catch();

             let oi;

             record === null ? (output.text('🤖 can\'t decide, eh? I understand, they\'re all too perfect for deletion.'))

         : oi = record.getCellValueAsString('Output')

                .length;

        let wc = record.getCellValue('Word Count')

        let id = record.id

        output.clear()

        if(oi>0){

            console.warn('Nothing to delete.');



          table.updateRecordAsync(id,{'Output':'','Word Count':0})

          console.info('Output field deleted.')

        }

        else output.clear();

        }

        };
