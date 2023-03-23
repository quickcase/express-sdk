import recordExtractor from '../record/extractor.js';
import {parse, renderer} from './template.js';

describe('parser', () => {
  test('should return all field paths used in template', () => {
    const template = `
      Regular field path: {{applicant.firstName}}
      Coerced boolean field path: {{hasDisability?}}
      Section:
        {{#address}}
          Relative address field: {{@.postcode}}
          Root field: {{applicant.lastName}}
        {{/address}}
    `;

    const fieldPaths = parse(template);

    expect(fieldPaths).toEqual([
      'applicant.firstName',
      'hasDisability', // <-- coercion suffix trimmed
      'address',
      '@.postcode',
      'applicant.lastName',
    ]);
  });
});

describe('renderer', () => {
  describe('should render template and index paths', () => {
    test.each([
      {
        data: {firstName: 'Henry'},
        template: 'Hello {{firstName}}',
        expected: 'Hello Henry',
      },
      {
        data: {firstName: 'Henry', lastName: 'Tudor'},
        template: 'Hello {{firstName}} {{lastName}}',
        expected: 'Hello Henry Tudor',
      },
    ])('template: $template', ({data, template, expected}) => {
      const extractor = recordExtractor({data});
      const render = renderer(extractor);

      expect(render(template)).toEqual(expected);
    });
  });

  describe('Conditional section', () => {
    test.each([
      {
        name: 'should not render section when variable undefined',
        data: {},
        template: '{{#field1}}Section{{/field1}}',
        expected: '', // <-- empty string
      },
      {
        name: 'should not render section when variable null',
        data: {field1: null},
        template: '{{#field1}}Section{{/field1}}',
        expected: '', // <-- empty string
      },
      {
        name: 'should not render section when variable empty string',
        data: {field1: ''},
        template: '{{#field1}}Section{{/field1}}',
        expected: '', // <-- empty string
      },
      {
        name: 'should render section when variable non-empty string',
        data: {field1: 'any string'},
        template: '{{#field1}}Section{{/field1}}',
        expected: 'Section',
      },
    ])('$name', ({data, template, expected}) => {
      const extractor = recordExtractor({data});
      const render = renderer(extractor);

      expect(render(template)).toEqual(expected);
    });
  });

  describe('Conditional section on complex with relative paths', () => {
    test('should render section and resolve paths relative to complex when complex is set', () => {
      const extractor = recordExtractor({
        data: {
          applicant: {
            firstName: 'Henry',
            lastName: 'Tudor',
          },
        },
      });
      const render = renderer(extractor);

      const output = render('{{#applicant}}Hello {{@.firstName}} {{@.lastName}}{{/applicant}}');

      expect(output).toEqual('Hello Henry Tudor');
    });

    test('should not render section when complex is falsy', () => {
      const extractor = recordExtractor({
        data: {
          applicant: undefined, // <-- falsy
        },
      });
      const render = renderer(extractor);

      const output = render('{{#applicant}}Hello {{@.firstName}} {{@.lastName}}{{/applicant}}');

      expect(output).toEqual('');
    });
  });

  describe('Repeated section on collection with relative paths', () => {
    test('should render section once per collection item and resolve paths relative to collection items when collection is set and non empty', () => {
      const extractor = recordExtractor({
        data: {
          addresses: [
            {
              value: {postcode: 'AA0 0AA'}
            },
            {
              value: {postcode: 'BB0 0BB'}
            },
            {
              value: {postcode: 'CC0 0CC'}
            },
          ],
        },
      });
      const render = renderer(extractor);

      const output = render('{{#addresses}}- {{@.value.postcode}}\n{{/addresses}}');

      expect(output).toEqual('- AA0 0AA\n- BB0 0BB\n- CC0 0CC\n');
    });

    test('should not render section when collection is empty', () => {
      const extractor = recordExtractor({
        data: {
          addresses: [], // <-- empty
        },
      });
      const render = renderer(extractor);

      const output = render('{{#addresses}}- {{@.value.postcode}}\n{{/addresses}}');

      expect(output).toEqual('');
    });
  });

  describe('Inverted section', () => {
    test.each([
      {
        name: 'should render section when variable undefined',
        data: {},
        template: '{{^field1}}Section{{/field1}}',
        expected: 'Section',
      },
      {
        name: 'should render section when variable null',
        data: {field1: null},
        template: '{{^field1}}Section{{/field1}}',
        expected: 'Section',
      },
      {
        name: 'should render section when variable empty string',
        data: {field1: ''},
        template: '{{^field1}}Section{{/field1}}',
        expected: 'Section',
      },
      {
        name: 'should not render section when variable non-empty string',
        data: {field1: 'any string'},
        template: '{{^field1}}Section{{/field1}}',
        expected: '', // <-- empty string
      },
    ])('$name', ({data, template, expected}) => {
      const extractor = recordExtractor({data});
      const render = renderer(extractor);

      expect(render(template)).toEqual(expected);
    });
  });

  describe('Inverted section with Yes/No coercion to boolean using `?` suffix', () => {
    test.each([
      {
        name: 'should coerce to false when undefined',
        data: {},
        template: '{{^field1?}}Section{{/field1?}}',
        expected: 'Section',
      },
      {
        name: 'should coerce to false when null',
        data: {field1: null},
        template: '{{^field1?}}Section{{/field1?}}',
        expected: 'Section',
      },
      {
        name: 'should coerce to false when empty string',
        data: {field1: ''},
        template: '{{^field1?}}Section{{/field1?}}',
        expected: 'Section',
      },
      {
        name: 'should coerce to false when value is anything but `yes`',
        data: {field1: 'something'},
        template: '{{^field1?}}Section{{/field1?}}',
        expected: 'Section',
      },
      {
        name: 'should coerce to false when value is `no`',
        data: {field1: 'no'},
        template: '{{^field1?}}Section{{/field1?}}',
        expected: 'Section',
      },
      {
        name: 'should coerce to false when value is `nO` (any case)',
        data: {field1: 'nO'},
        template: '{{^field1?}}Section{{/field1?}}',
        expected: 'Section',
      },
      {
        name: 'should coerce to true when value is `yes`',
        data: {field1: 'yes'},
        template: '{{^field1?}}Section{{/field1?}}',
        expected: '', // <-- empty string
      },
      {
        name: 'should coerce to true when value is `yEs` (any case)',
        data: {field1: 'yEs'},
        template: '{{^field1?}}Section{{/field1?}}',
        expected: '', // <-- empty string
      },
    ])('$name', ({data, template, expected}) => {
      const extractor = recordExtractor({data});
      const render = renderer(extractor);

      expect(render(template)).toEqual(expected);
    });
  });

  describe('Conditional section with Yes/No coercion to boolean using `?` suffix', () => {
    test.each([
      {
        name: 'should coerce to false when undefined',
        data: {},
        template: '{{#field1?}}Section{{/field1?}}',
        expected: '', // <-- empty string
      },
      {
        name: 'should coerce to false when null',
        data: {field1: null},
        template: '{{#field1?}}Section{{/field1?}}',
        expected: '', // <-- empty string
      },
      {
        name: 'should coerce to false when empty string',
        data: {field1: ''},
        template: '{{#field1?}}Section{{/field1?}}',
        expected: '', // <-- empty string
      },
      {
        name: 'should coerce to false when value is anything but `yes`',
        data: {field1: 'something'},
        template: '{{#field1?}}Section{{/field1?}}',
        expected: '', // <-- empty string
      },
      {
        name: 'should coerce to false when value is `no`',
        data: {field1: 'no'},
        template: '{{#field1?}}Section{{/field1?}}',
        expected: '', // <-- empty string
      },
      {
        name: 'should coerce to false when value is `nO` (any case)',
        data: {field1: 'nO'},
        template: '{{#field1?}}Section{{/field1?}}',
        expected: '', // <-- empty string
      },
      {
        name: 'should coerce to true when value is `yes`',
        data: {field1: 'yes'},
        template: '{{#field1?}}Section{{/field1?}}',
        expected: 'Section',
      },
      {
        name: 'should coerce to true when value is `yEs` (any case)',
        data: {field1: 'yEs'},
        template: '{{#field1?}}Section{{/field1?}}',
        expected: 'Section',
      },
    ])('$name', ({data, template, expected}) => {
      const extractor = recordExtractor({data});
      const render = renderer(extractor);

      expect(render(template)).toEqual(expected);
    });
  });
});
