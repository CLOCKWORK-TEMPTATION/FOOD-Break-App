// نظام إدارة الطلبات اليومية
const orderController = {
  
  // إنشاء طلب جديد
  createOrder: async (req, res) => {
    try {
      const { userId, projectId, menuItems, orderWindow } = req.body;
      
      // التحقق من نافذة الطلب (الساعة الأولى من التصوير)
      const currentTime = new Date();
      const orderStartTime = new Date(orderWindow.startTime);
      const orderEndTime = new Date(orderWindow.endTime);
      
      if (currentTime < orderStartTime || currentTime > orderEndTime) {
        return res.status(400).json({ 
          error: 'انتهت فترة تقديم الطلبات',
          orderWindow: { start: orderStartTime, end: orderEndTime }
        });
      }
      
      // حساب إجمالي السعر
      const totalPrice = menuItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      
      const order = {
        id: Date.now().toString(),
        userId,
        projectId,
        menuItems,
        totalPrice,
        status: 'pending',
        createdAt: new Date().toISOString()
      };
      
      // TODO: حفظ في قاعدة البيانات
      
      res.json({
        success: true,
        order,
        message: 'تم تقديم الطلب بنجاح'
      });
    } catch (error) {
      console.error('خطأ في إنشاء الطلب:', error);
      res.status(500).json({ error: 'فشل في تقديم الطلب' });
    }
  },
  
  // تأكيد الطلب
  confirmOrder: async (req, res) => {
    try {
      const { orderId } = req.params;
      const { confirmed } = req.body;
      
      // TODO: تحديث حالة الطلب في قاعدة البيانات
      
      res.json({
        success: true,
        orderId,
        status: confirmed ? 'confirmed' : 'cancelled',
        message: confirmed ? 'تم تأكيد الطلب' : 'تم إلغاء الطلب'
      });
    } catch (error) {
      console.error('خطأ في تأكيد الطلب:', error);
      res.status(500).json({ error: 'فشل في تأكيد الطلب' });
    }
  },
  
  // جمع طلبات الفريق
  aggregateTeamOrders: async (req, res) => {
    try {
      const { projectId } = req.params;
      
      // TODO: جلب جميع طلبات المشروع من قاعدة البيانات
      const orders = []; // placeholder
      
      // تجميع الطلبات حسب المطعم
      const aggregatedOrders = orders.reduce((acc, order) => {
        order.menuItems.forEach(item => {
          const key = `${item.restaurantId}-${item.itemId}`;
          if (!acc[key]) {
            acc[key] = {
              restaurantId: item.restaurantId,
              restaurantName: item.restaurantName,
              itemId: item.itemId,
              itemName: item.itemName,
              price: item.price,
              quantity: 0,
              totalPrice: 0
            };
          }
          acc[key].quantity += item.quantity;
          acc[key].totalPrice += item.price * item.quantity;
        });
        return acc;
      }, {});
      
      res.json({
        success: true,
        aggregatedOrders: Object.values(aggregatedOrders),
        totalOrders: orders.length
      });
    } catch (error) {
      console.error('خطأ في تجميع الطلبات:', error);
      res.status(500).json({ error: 'فشل في تجميع الطلبات' });
    }
  }
};

module.exports = orderController;