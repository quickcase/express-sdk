import extractMember from './extract-member.js';

const extractCollectionMember = (extract, collectionPath) => extractMember(extract, collectionPath + '[].value');

export default extractCollectionMember;
