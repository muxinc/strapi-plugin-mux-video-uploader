import pluginId from '../../pluginId';
import { CustomFieldIcon } from './components';

export const muxVideoUploaderCustomField: any = {
  name: 'mux-video-uploader',
  pluginId,
  type: 'json',
  icon: CustomFieldIcon,
  intlLabel: {
    defaultMessage: 'Mux Video Uploader',
    description: '',
    id: 'CustomField.label',
  },
  intlDescription: {
    defaultMessage: 'Specify video uploaded to Mux',
    description: '',
    id: 'CustomField.description',
  },
  components: {
    Input: async () => import('./components/input'),
  },
  options: {
    base: [],
    advanced: [],
    validator: () => ({}),
  },
};
