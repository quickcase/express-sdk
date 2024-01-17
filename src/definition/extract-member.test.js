import extractField from './extract-field.js';
import extractMember from './extract-member.js';

const extractor = extractField({
    fields: {
        'complex1': {
            type: 'complex',
            members: {
                'member1': {id: 'member1', type: 'string'},
                'member2': {id: 'member2', type: 'string'},
                'member3': {id: 'member3', type: 'string'},
            },
        }
    },
});

describe('when single member path', () => {
    test('should extract member from complex', () => {
        expect(
            extractMember(extractor, 'complex1')('member1')
        ).toEqual({id: 'member1', type: 'string'});
    });

    test('should extract metadata from root', () => {
        expect(
            extractMember(extractor, 'complex1')('[reference]')
        ).toEqual({
          id: '[reference]',
          type: 'metadata',
          label: 'Reference',
        });
    });

  test('should extract member from complex', () => {
    expect(() => extractMember(extractor, 'complex1')(1)
    ).toThrow(`Unsupported path '1' of type number`);
  });
});

describe('when array of member paths', () => {
    test('should extract members from complex in same order', () => {
        expect(extractMember(extractor, 'complex1')([
            'member2',
            'member1',
            'member3',
        ])).toEqual([
            {id: 'member2', type: 'string'},
            {id: 'member1', type: 'string'},
            {id: 'member3', type: 'string'},
        ]);
    });

  test('should extract metadata from root', () => {
    expect(
      extractMember(extractor, 'complex1')(['member1', '[reference]'])
    ).toEqual([
      {id: 'member1', type: 'string'},
      {
        id: '[reference]',
        type: 'metadata',
        label: 'Reference',
      },
    ]);
  });
});

describe('when object of member paths', () => {
    test('should extract members from complex with matching shape', () => {
        expect(extractMember(extractor, 'complex1')({
            '1': 'member2',
            '2': 'member1',
            '3': 'member3',
        })).toEqual({
            '1': {id: 'member2', type: 'string'},
            '2': {id: 'member1', type: 'string'},
            '3': {id: 'member3', type: 'string'},
        });
    });

  test('should extract metadata from root', () => {
    expect(extractMember(extractor, 'complex1')({
      '1': 'member2',
      '2': '[reference]',
    })).toEqual({
      '1': {id: 'member2', type: 'string'},
      '2': {
        id: '[reference]',
        type: 'metadata',
        label: 'Reference',
      },
    });
  });
});
