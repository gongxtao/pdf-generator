import { generateHtmlAction, GenerateHtmlInput } from './generate-html';

/**
 * 调用generateHtmlAction接口的示例文件
 * 这个文件展示了如何使用generateHtmlAction接口来生成HTML内容
 */

/**
 * 调用generateHtmlAction接口的主函数
 * @param inputData 输入数据
 * @param modelName 模型名称，默认为'chatgpt-4o'
 */
async function callGenerateHtml(inputData: GenerateHtmlInput, modelName: string = 'chatgpt-4o') {
  try {
    console.log('开始调用generateHtmlAction接口...');
    console.log('输入数据:', inputData);
    console.log('使用模型:', modelName);
    
    // 调用接口
    const result = await generateHtmlAction(inputData, modelName);
    
    // 输出结果
    console.log('\n=== 接口调用结果 ===');
    console.log('成功状态:', result.success);
    
    if (result.success) {
      console.log('生成的HTML内容:');
      console.log(result.content);
    } else {
      console.log('错误信息:', result.content);
      if (result.error) {
        console.log('详细错误:', result.error);
      }
    }
    
    return result;
    
  } catch (error) {
    console.error('调用过程中发生错误:', error);
    throw error;
  }
}

/**
 * 示例用法
 * 取消下面代码的注释来运行示例
 */

// 示例1: 基本用法
const example1 = async () => {
  const inputData: GenerateHtmlInput = {
    css: `
      @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@400;700&family=Lato:wght@400;700&display=swap');\n\n/* IMPORTANT Do not modify this stylesheet in any way unless explicitly instructed */\n/* IMPORTANT - When dealing with Arabic text, employ lang=\"ar\" and dir=\"rtl\" and make any \"border-left:\" to be \"border-right:\" to ensure they display on the right side of the page and align with the Arabic text.*/\n\n:root {\n--primary-red: #E4002B;\n--primary-blue: #0033A0;\n--accent-blue: #007FFF;\n--text-color: #333333;\n--background-color: #FFFFFF;\n\n--h1-color: var(--primary-red);\n--h2-color: var(--primary-blue);\n--h3-color: var(--primary-red);\n--h4-color: var(--accent-blue);\n--h5-color: var(--text-color);\n--h6-color: var(--text-color);\n}\n\nh1, h2, h3, h4, h5, h6 {\nfont-family: 'Oswald', sans-serif;\nfont-weight: 700;\n}\n\nh1, .cover-page-main-title {\nfont-size: 24pt;\ntext-align: center;\nmargin-bottom: 0.3in;\ncolor: var(--h1-color);\nposition: relative;\npadding-bottom: 10px;\nborder-bottom: 4px solid var(--primary-blue);\n}\n\nh1::before, .cover-page-main-title::before {\ncontent: \"\"\"\";\nposition: absolute;\nbottom: -14px;\nleft: 50%;\ntransform: translateX(-50%);\nwidth: 60%;\nheight: 4px;\nbackground-color: var(--primary-red);\n}\n\nh2 {\nfont-size: 18pt;\ncolor: var(--h2-color);\nposition: relative;\npadding-left: 20px;\nmargin-top: 0.4in;\nmargin-bottom: 0.2in;\nborder-left: 8px solid var(--primary-red);\nline-height: 1.5;\n}\n\nh3 {\nfont-size: 16pt;\ncolor: var(--h3-color);\nmargin-top: 0.3in;\nmargin-bottom: 0.15in;\nborder-bottom: 2px dotted var(--accent-blue);\npadding-bottom: 5px;\n}\n\nh4 {\nfont-size: 14pt;\ncolor: var(--h4-color);\nmargin-top: 0.2in;\nmargin-bottom: 0.1in;\nposition: relative;\n}\n\nh4::before {\nposition: absolute;\nleft: 0;\ncolor: var(--primary-red);\nfont-size: 1em;\ntop: 50%;\ntransform: translateY(-50%);\n}\n\nh5 {\nfont-size: 12pt;\ncolor: var(--h5-color);\nfont-weight: 700;\nmargin-top: 0.15in;\nmargin-bottom: 0.05in;\n}\n\nh6 {\nfont-size: 11pt;\ncolor: var(--h6-color);\nfont-weight: 400;\nmargin-top: 0.1in;\nmargin-bottom: 0.05in;\n}\n\n/* Never make adjustments to the body CSS */\nbody {\nfont-family: 'Lato', sans-serif;\ncolor: var(--text-color);\nbox-sizing: border-box;\nbackground-color: var(--background-color);\nline-height: 1.5;\n}\n\n/* Use this for Arabic text and design elements*/\n.rtl {\ndirection: rtl;\n}\n\n/* Use this highlight-block class sparingly. Only apply it to content that really stands out from the rest.*/\n.highlight-block {\nbackground-color: var(--primary-blue);\ncolor: var(--background-color);\npadding: 0.25in;\nmargin-bottom: 0.2in;\nmargin-top: 0.2in;\nborder-radius: 10px;\nborder-left: 8px solid var(--primary-red);\nfont-weight: 400;\nposition: relative;\noverflow: hidden;\n}\n\n.highlight-block p {\ncolor: var(--background-color);\n}\n\nli::marker {\ncolor: var(--primary-red);\nfont-weight: bold;\n}\n\n.marker {\ncolor: var(--primary-red);\nfont-weight: bold;\nmargin-right: 0.5em;\n}\n\n.table-title {\nfont-weight: bold;\nmargin-bottom: 10px;\npage-break-after: avoid;\nfont-size: 14pt;\ncolor: var(--primary-blue);\ntext-transform: uppercase;\n}\n\ntable {\ntable-layout: fixed;\nwidth: 100%;\nborder-collapse: collapse;\nborder-spacing: 0;\nmargin-bottom: 40px;\nborder: 2px solid var(--primary-blue);\nborder-radius: 8px;\noverflow: hidden;\n}\n\nth, td {\nborder: 1px solid var(--accent-blue);\nword-wrap: break-word;\noverflow-wrap: break-word;\nmax-width: 1px;\npadding: 12px 4px;\ntext-align: center;\nfont-size: 10pt;\nfont-weight: 400;\ncolor: var(--text-color);\n}\n\ntable th {\ncolor: var(--background-color);\nbackground-color: var(--primary-blue);\nfont-weight: 500;\nfont-size: 10pt;\ntext-transform: uppercase;\nhyphens: auto;\n}\n\ntd {\nline-height: 1.4;\n}\n\nthead tr {\nbackground: linear-gradient(to right, var(--primary-blue), var(--accent-blue));\ncolor: white;\n}\n\ntr:nth-child(odd) {\nbackground-color: #F0F8FF;\n}\n\ntr:nth-child(even) {\nbackground-color: var(--background-color);\n}\n\n/* !!!*!!! Use this on tables where the first column SHOULD be highlighted. */\n.highlight-first-col td:first-child {\n  color: white;\n  background: var(--primary-blue);\n  font-weight: 500;\n  text-transform: uppercase;\n  hyphens: auto;\n}\n\na {\ncolor: var(--primary-red);\ntext-decoration: underline;\ntext-decoration-color: var(--accent-blue);\ntext-underline-offset: 3px;\n}\n\nblockquote {\nfont-style: italic;\nborder-left: 5px solid var(--accent-blue);\npadding-left: 15px;\nmargin-left: 0;\ncolor: #555555;\n}\n\nhr {\nborder: none;\nheight: 3px;\nbackground: linear-gradient(to right, var(--primary-red), var(--primary-blue));\nmargin: 30px 0;\n}\n\n /* !!!*!!! Only implement .cover-page class if provided with cover page text */\n.cover-page {\n}\n\n.cover-page-subtitles {\n}\n\n.cover-page-subtitles {\n}\n\n/* Use this for any field lines and text placeholders. Example: <div class=\"form-line\"> <span>Example Text:</span> <span>_______________________</span> </div> */\n.form-line {\nmargin: 15px 0;\nwhite-space: normal;\noverflow: hidden;\n}
    `,
    input: `1000字小说

被死神吻过的差生

班主任当众骂我「社会渣滓，早晚横死街头」。全班哄笑中，我平静地举起满是割痕的手腕：「老师，我昨天已经死过一次了。」「但死神说我的阳寿是88岁，还有70年可活。」「他还说，您——今晚十二点就要死。」



粉笔灰在午后的阳光里慢悠悠地飘，像一场廉价的雪。李老师的声音尖利，穿透这虚假的宁静，粉笔头精准地砸在我额角，碎成一小撮白末。

“林默！又在睡！你这种渣滓，除了混吃等死还会干什么？”

哄笑声炸开，潮水般涌来，熟悉得令人麻木。我抬起沉重的眼皮，看见一张张咧开的嘴，扭曲的快乐挂在每一张年轻的脸上。前排的陈浩笑得最大声，身子后仰，几乎要从椅子上翻下去。

李老师很满意这效果，她踱着步，高跟鞋敲打水泥地，嘚嘚作响，像刑前的鼓点。她停在我桌前，阴影笼罩下来，带着劣质香水和粉笔灰混合的味道。

“看看你这鬼样子！”她手指几乎戳到我鼻尖，“成绩烂泥扶不上墙，整天死气沉沉！我告诉你，林默，像你这种社会垃圾，不思进取，早晚横死街头！连收尸的人都没有！”

恶毒的诅咒，裹着“为你好”的糖衣，轻车熟路。教室里笑得更欢了，这是他们枯燥备考生活里绝佳的调味品。

我该低头吗？还是该像以前一样，让脸烧起来，让耳朵嗡嗡作响，让心脏缩成一团沉甸甸的石头？

都没有。

一种奇异的平静，冰一样覆上来。昨天深夜那濒死的窒息，卫生间里弥漫的铁锈味，还有那片吞噬一切的、温暖到令人沉溺的黑暗……它们太真实了，真实到眼前这喧嚣变得像一幕拙劣的皮影戏。

我慢慢站起来，椅子腿摩擦地面，发出刺耳的吱呀声。笑声零星地停顿了一下，似乎有些意外我的反应。

李老师皱眉，不耐烦：“干什么？说你还不服气？”

我没说话，只是沉默地，开始卷自己左手的校服袖子。布料摩擦过皮肤，露出底下缠绕的、脏兮兮的纱布。解开的动作很慢，一圈，又一圈。

笑声彻底死了。教室里静得可怕，只剩下我拆解纱布的细微窸窣声。几十道目光钉在我的手腕上。

最后一层纱布落下。

底下不是一道伤口，是纵横交错、新旧叠加的无数道。有些已经褪成浅粉的疤，有些还鲜红刺目，最深的那一道，横亘在青色的血管上，皮肉微微外翻，昨天夜里才添上去的，几乎斩断了一切。

抽气声，短促而惊惧，从某个角落响起。

我把那只伤痕累累的手腕抬起来，平静地，举到李老师眼前，举给全班看。阳光赤裸地照在上面，每一道伤疤都无所遁形。

我的声音干涩，却异常清晰，砸在死寂的空气里：

“老师，我昨天已经死过一次了。”

李老师的脸瞬间褪了色，嘴唇张了张，却没发出声音。她眼底闪过一丝不易察觉的慌乱。

我不看她，继续往下说，像在复述一个与己无关的事实：

“但死神把我退回来了。”我顿了顿，感受到所有凝固的视线，“他说，我的阳寿是八十八岁。所以……”

我的目光重新聚焦，第一次，真正地、笔直地看向李老师那双无法掩饰惊惶的眼睛。

“所以，我还有整整七十年可活。”

她像是终于找回了自己的声音，尖厉却底气不足：“你…你胡说什么！疯了不成！给我滚出去！”

我没动，最后那句话，终于脱口而出，轻得像叹息，却又重得能砸碎一切：

“他还说……”

“您——”

“今晚十二点。”

“就要死。”

死寂。绝对的死寂。空气凝固成了水泥，封住了每个人的口鼻。

李老师的脸从煞白瞬间涨成猪肝色，是愤怒，还是恐惧？或许都有。她手指颤抖地指着我，嗓音劈叉：“反了！反了！你不仅堕落，还敢诅咒老师！滚！立刻给我滚去教务处！”

我没再说话，只是开始慢条斯理地重新缠上纱布，一圈，又一圈，遮住那些触目惊心的痕迹。然后，在全世界凝固的注视里，收拾好书包，背上，走出座位。

经过讲台时，我停了一下，没有看她。

“老师，”我轻声说，“今晚，别睡太沉。”

门在我身后关上，隔绝了教室里骤然炸开的、混乱不堪的声浪。

走廊空无一人，阳光透过尽头的窗户，照得一片明亮，却冷得很。

我不知道那句话是怎么从我嘴里说出来的，就像我不知道昨天夜里，意识沉入最深的海底时，那个冰冷又带着奇异叹息的声音，究竟是幻觉，还是……

脚步声在身后响起，很急。是班长苏晓，她追了出来，脸上没了平时的矜持，只有苍白的惊慌。

“林默！”她抓住我的胳膊，手指冰凉，“你刚才说的是不是真的？你……你真的……”

我看着她，看着这个从未和我说过一句话的、优等生班长。

“午夜十二点。”我重复了一遍，抽回手臂，“很快了。”

她的眼睛骤然睁大，恐惧明明白白地写在里面。

我转身继续往前走，把她和身后那片混乱留在那里。

时间突然变得很慢，又很快。

放学铃响得惊天动地。学生们潮水般涌出教室，但经过我身边时，都下意识地绕开一小段距离，投来的目光混杂着惊疑、恐惧，还有一丝不易察觉的、对禁忌的兴奋。窃窃私语声像潮湿的虫子，钻进耳朵。

“疯子……”

“真的假的啊？”

“看她那手腕，吓死人……”

“李老师脸都气紫了……”

我没有回家。

我在旧街区的巷口坐下，看着夕阳一点一点把天空染成血色，再看着那血色褪去，墨蓝浸染，最后彻底漆黑。路灯亮起，昏黄的一小团，飞蛾盲目地撞击着灯罩。

时间，一格一格，走向判决的时刻。

十一点四十五。

我站起来，腿有些麻。鬼使神差地，我走向学校旁边的那片老居民区。李老师家就在临街那栋楼的四楼，我知道，那次挨骂后，她曾指着那扇窗户骂：“我家狗都比你住得离学校近！”

窗口黑着。

我站在对面一株老槐树的阴影下，像一尊沉默的石像。夜风很凉，吹得树叶沙沙响。

心脏在胸腔里跳得很沉，一下，又一下。

还有五分钟。

楼上那扇漆黑的窗户里，突然——灯亮了。

惨白的光线瞬间撕裂黑暗，刺得人眼疼。

紧接着，一声无法形容的、极度惊骇的尖叫声猛地从那个窗口炸开，尖锐地划破寂静的夜空，只持续了极短的一瞬，像被什么东西猛地掐断！

然后，死寂。

比之前更深的死寂笼罩下来。那盏刚刚亮起的灯，还惨白地亮着，照着那扇空洞的窗口，像一个巨大的、愕然张开的嘴。

我站在树下，影子被拉得很长。

风吹过，我打了个冷颤。

腕上，那道最深的伤口在纱布底下，突兀地、剧烈地抽痛了一下。

好像有什么东西，刚刚从身边经过，带起一阵刺骨的寒。

`,
    extra: []
  };
  
  await callGenerateHtml(inputData);
};

// 示例2: 使用不同的模型
const example2 = async () => {
  const inputData: GenerateHtmlInput = {
    css: '.container { max-width: 800px; margin: 0 auto; }',
    input: '这是另一个测试内容，用来验证不同模型的效果。',
    extra: []
  };
  
  await callGenerateHtml(inputData, 'chatgpt-4o');
};

// 运行示例（取消注释来执行）
example1();
// example2();


/**
 * 使用说明：
 * 
 * 1. 确保已经配置了REPLICATE_API_TOKEN环境变量
 *    - 复制.env.example为.env.local
 *    - 在.env.local中填入你的Replicate API Token
 * 
 * 2. 在终端中运行这个文件：
 *    npx ts-node call-generate-html.ts
 * 
 * 3. 或者在其他TypeScript文件中导入使用：
 *    import { callGenerateHtml } from './call-generate-html';
 * 
 * 4. 根据需要修改inputData中的css和input内容
 * 
 * 5. 可以指定不同的模型名称（需要在content/prompt目录下有对应的.md文件）
 */