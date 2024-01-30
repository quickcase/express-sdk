import extractMember from './extract-member';

const extractCollectionMember = (extract, collectionPath) => extractMember(extract, collectionPath + '[].value');

export default extractCollectionMember;
