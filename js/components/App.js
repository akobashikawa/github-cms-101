import { ref, useTemplateRef, onMounted, watch, nextTick } from 'vue';
import axios from 'axios';

const App = {

	components: {
	},

	template: `
	<h1>GitHub CMS</h1>


	<footer>
		<em><a href="https://github.com/akobashikawa/github-cms-101" target="_blank">@GitHub></a></em>
	</footer>
    `,

	setup() {
		
		onMounted(() => {
		});

		return {
			
		}
	},

};

export default App;