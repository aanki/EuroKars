/**
 * @NApiVersion 2.0
 * @NScriptType MapReduceScript
 */
define(['N/search', 'N/record', 'N/log','N/format'], function (search, record, log,format) {

    function getInputData() {
        try {
            // Calculate date 3 days ago
            // var DateObj = new Date();
            // var NewDateObj = new Date(DateObj.getFullYear(), DateObj.getMonth(), (DateObj.getDate() ));
            // log.debug("NewDateObj", NewDateObj);
            // var NewDateString = format.format({ value: NewDateObj, type: format.Type.DATE });
            // log.debug("NewDateString", NewDateString);

            // log.debug('Filter Date (3 days ago)', NewDateString);
            return search.create({
                type: 'customrecord_buffer_table', // parent buffer record
                columns: ['internalid']
            });
        } catch (e) {
            log.debug('Error in getInputData', e);
        }
    }

    function map(context) {
        try {
            var result = JSON.parse(context.value);
            var recId = result.id;

            if (recId) {
                record.delete({
                    type: 'customrecord_buffer_table',
                    id: recId
                });
                log.debug('Deleted Buffer Record', result);
            }
        } catch (e) {
            log.error('Error in map stage', e);
        }
    }

    function summarize(summary) {
        log.audit('Summary', {
            usage: summary.usage,
            concurrency: summary.concurrency,
            yields: summary.yields
        });

        summary.mapSummary.errors.iterator().each(function (key, error) {
            log.debug('Error deleting record ID ' + key, error);
            return true;
        });
    }

    return {
        getInputData: getInputData,
        map: map,
        summarize: summarize
    };

});
